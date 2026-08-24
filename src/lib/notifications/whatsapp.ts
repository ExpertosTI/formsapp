import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  isSafeTenantInstance,
  resolveEvoCreds,
  tenantInstanceName,
  whatsappConfigured,
} from "./evo";
import { normalizeEvoPhone, whatsAppClickUrl } from "./phone";

export interface WhatsAppSendResult {
  ok: boolean;
  sent: boolean;
  manualUrl?: string;
  error?: string;
  provider?: "evolution" | "manual";
  messageId?: string;
}

type EvoResult = {
  success: boolean;
  data?: any;
  error?: string;
  status?: number;
};

// ==========================================
// GUARDARRAÍLES Y PARÁMETROS ANTI-BLOQUEO
// ==========================================
const BASE_QUEUE_GAP_MS = 6_500; // Espaciado mínimo de 6.5s entre envíos
const MAX_QUEUE_PER_INSTANCE = 50; // Límite de mensajes en cola por empresa
const MAX_HOURLY_MESSAGES_PER_INSTANCE = 80; // Máximo 80 mensajes por hora para evitar bloqueos
const DEDUP_TTL_MS = 90_000; // 90 segundos de idempotencia contra envíos duplicados
const MAX_SEND_ATTEMPTS = 3;
const RETRY_BACKOFF_MS = [4_000, 12_000, 28_000];

type WaJob = {
  instanceName: string;
  phone: string;
  text: string;
  attempt: number;
  resolve: (v: { ok: boolean; sent: boolean; messageId?: string; error?: string }) => void;
};

const waQueues = new Map<string, WaJob[]>();
const waDraining = new Map<string, boolean>();
const waLastSentAt = new Map<string, number>();
const waRecentKeys = new Map<string, number>();
const waHourlyCounter = new Map<string, { count: number; windowStart: number }>();

function waDedupKey(instanceName: string, phone: string, text: string) {
  return `${instanceName}|${phone}|${text.slice(0, 100)}`;
}

function checkHourlyRateLimit(instanceName: string): boolean {
  const now = Date.now();
  const current = waHourlyCounter.get(instanceName);

  if (!current || now - current.windowStart > 3_600_000) {
    waHourlyCounter.set(instanceName, { count: 1, windowStart: now });
    return true;
  }

  if (current.count >= MAX_HOURLY_MESSAGES_PER_INSTANCE) {
    return false; // Límite por hora alcanzado
  }

  current.count += 1;
  return true;
}

function getRandomJitterMs(): number {
  // Jitter aleatorio entre 1.5s y 3.5s para simular comportamiento humano
  return Math.floor(Math.random() * 2000) + 1500;
}

async function evoFetch(route: string, options: RequestInit = {}): Promise<EvoResult> {
  const creds = resolveEvoCreds();
  if (!creds) {
    return { success: false, error: "Evolution API no está configurada en el servidor (.evolution.local / env)" };
  }

  try {
    const fullUrl = `${creds.url}${route}`;
    const res = await fetch(fullUrl, {
      ...options,
      signal: AbortSignal.timeout(25_000),
      headers: {
        "Content-Type": "application/json",
        apikey: creds.key,
        ...(options.headers || {}),
      },
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const err = parseEvoError(data, res.status);
      console.error(`[Evo API Error] ${route} -> Status ${res.status}:`, err, data);
      return { success: false, error: err, data, status: res.status };
    }
    return { success: true, data, status: res.status };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error de red al conectar con Evolution API";
    console.error(`[Evo Fetch Error] ${route}:`, message);
    return { success: false, error: message };
  }
}

function parseEvoError(data: any, status?: number): string {
  const msg = data?.message ?? data?.error ?? data?.response?.message;
  if (Array.isArray(msg)) {
    return msg
      .map((m) => (typeof m === "string" ? m : JSON.stringify(m)))
      .join(", ")
      .slice(0, 240);
  }
  if (typeof msg === "string" && msg.trim()) return msg.slice(0, 240);
  if (msg && typeof msg === "object") return JSON.stringify(msg).slice(0, 240);
  if (status === 404) return "Instancia o recurso no encontrado (404)";
  if (status === 401) return "No autorizado (401) — API Key inválida";
  if (status === 403) return "Prohibido (403)";
  if (status === 429) return "Límite de peticiones alcanzado (429 Rate Limit)";
  return status ? `Error HTTP ${status}` : "Falló la petición a Evolution API";
}

function humanizeEvolutionError(err?: string, status?: number, opts?: { probeOk?: boolean }): string {
  const e = String(err || "").toLowerCase();
  const probeOk = opts?.probeOk === true;

  if (!probeOk && (status === 401 || e.includes("unauthorized"))) {
    return "Evolution API rechazó la API Key (AUTHENTICATION_API_KEY).";
  }
  if (status === 401 || e.includes("unauthorized")) {
    return "Evolution 401: La API Key configurada no tiene permisos para crear instancias.";
  }
  if (status === 403 || e.includes("forbidden")) {
    return `Evolution 403 Forbidden: ${err || "Permiso denegado"}`;
  }
  if (status === 404 || e.includes("not found") || e.includes("does not exist") || e.includes("not exist")) {
    return "La instancia aún no existe en Evolution API.";
  }
  if (e.includes("timeout") || e.includes("fetch failed") || e.includes("network")) {
    return "No se pudo conectar con el servidor de Evolution API (revisa la URL o la red).";
  }
  if (err) return status ? `${err} (HTTP ${status})` : err;
  return status ? `HTTP ${status}` : "Falló la comunicación con Evolution API";
}

function extractQr(data: any): string | null {
  if (!data) return null;
  const candidates = [
    data?.qrcode?.base64,
    data?.base64,
    data?.qr?.base64,
    data?.code,
    data?.pairingCode,
    typeof data?.qrcode === "string" ? data.qrcode : null,
    typeof data?.qr === "string" ? data.qr : null,
  ];

  for (const raw of candidates) {
    if (typeof raw !== "string") continue;
    const cleaned = raw.replace(/^data:image\/[a-zA-Z+]+;base64,/, "");
    if (cleaned.length < 50) continue;
    return raw.startsWith("data:") ? raw : `data:image/png;base64,${cleaned}`;
  }
  return null;
}

function extractInstanceToken(data: any): string | null {
  const candidates = [
    data?.hash?.apikey,
    data?.hash?.apiKey,
    data?.apikey,
    data?.apiKey,
    data?.token,
    data?.instance?.apikey,
    data?.instance?.token,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim().length >= 16) return c.trim();
  }
  return null;
}

function extractState(data: any): string {
  return String(
    data?.instance?.state || data?.state || data?.connectionState || data?.status || "unknown"
  ).toLowerCase();
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function probeEvolutionAdmin() {
  const result = await evoFetch("/instance/fetchInstances");
  if (!result.success) {
    return {
      ok: false as const,
      error: humanizeEvolutionError(result.error, result.status),
      status: result.status,
    };
  }
  return { ok: true as const };
}

export async function getEvolutionConnectionState(instanceName: string) {
  if (!whatsappConfigured()) {
    return { configured: false, state: "not_configured", instance: instanceName };
  }
  const name = instanceName.trim();
  if (!name) {
    return { configured: true, state: "missing", instance: name, error: "Sin instancia" };
  }

  const result = await evoFetch(`/instance/connectionState/${encodeURIComponent(name)}`);
  if (!result.success) {
    const missing = result.status === 404 || /not found/i.test(String(result.error || ""));
    return {
      configured: true,
      state: missing ? "missing" : "error",
      instance: name,
      error: humanizeEvolutionError(result.error, result.status),
    };
  }
  return {
    configured: true,
    state: extractState(result.data),
    instance: name,
    raw: result.data,
  };
}

export async function startWhatsAppSession(instanceName: string) {
  const name = instanceName.trim();
  if (!name || !isSafeTenantInstance(name)) {
    return {
      ok: false as const,
      instanceName: name,
      qrcode: null as string | null,
      error: "Nombre de instancia no permitido",
    };
  }

  const creds = resolveEvoCreds();
  if (!creds) {
    return {
      ok: false as const,
      instanceName: name,
      qrcode: null as string | null,
      error: "Evolution API no configurada en el servidor (.evolution.local o EVOLUTION_API_KEY)",
    };
  }

  // 1) Probar que Evolution responda
  const probe = await probeEvolutionAdmin();
  if (!probe.ok) {
    return {
      ok: false as const,
      instanceName: name,
      qrcode: null as string | null,
      error: probe.error,
    };
  }

  // 2) Verificar si ya está conectada (open)
  const live = await evoFetch(`/instance/connectionState/${encodeURIComponent(name)}`);
  if (live.success && extractState(live.data) === "open") {
    return {
      ok: true as const,
      instanceName: name,
      qrcode: null as string | null,
      alreadyConnected: true as const,
    };
  }

  // 3) Crear la instancia (si no existe)
  let token: string | null = null;
  const created = await evoFetch("/instance/create", {
    method: "POST",
    body: JSON.stringify({
      instanceName: name,
      qrcode: true,
      integration: "WHATSAPP-BAILEYS",
    }),
  });

  if (created.success) {
    token = extractInstanceToken(created.data);
    const qrCreate = extractQr(created.data);
    if (qrCreate) {
      return { ok: true as const, instanceName: name, qrcode: qrCreate, token };
    }
  }

  const already =
    created.status === 403 ||
    created.status === 409 ||
    /already|exist/i.test(String(created.error || ""));

  if (!created.success && !already) {
    if (created.status === 401) {
      return {
        ok: false as const,
        instanceName: name,
        qrcode: null as string | null,
        error: humanizeEvolutionError(created.error, created.status, { probeOk: true }),
      };
    }
  }

  // 4) Connect -> QR
  await sleep(400);
  const conn = await evoFetch(`/instance/connect/${encodeURIComponent(name)}`);
  if (conn.success) {
    const qr = extractQr(conn.data);
    if (qr) {
      return {
        ok: true as const,
        instanceName: name,
        qrcode: qr,
        token: token || extractInstanceToken(conn.data),
      };
    }
  }

  if (created.success || already) {
    await sleep(600);
    const retryConn = await evoFetch(`/instance/connect/${encodeURIComponent(name)}`);
    if (retryConn.success) {
      const retryQr = extractQr(retryConn.data);
      if (retryQr) {
        return {
          ok: true as const,
          instanceName: name,
          qrcode: retryQr,
          token: token || extractInstanceToken(retryConn.data),
        };
      }
    }

    return {
      ok: false as const,
      instanceName: name,
      qrcode: null as string | null,
      error: "Instancia creada en Evolution API pero esperando generación de QR. Pulsa 'Mostrar código QR' nuevamente.",
    };
  }

  return {
    ok: false as const,
    instanceName: name,
    qrcode: null as string | null,
    error: humanizeEvolutionError(
      created.error || conn.error || "No se pudo generar el código QR",
      created.status || conn.status,
      { probeOk: true }
    ),
  };
}

export async function disconnectWhatsAppSession(instanceName: string) {
  const name = instanceName.trim();
  if (!name) return { ok: false, error: "Sin instancia" };
  const res = await evoFetch(`/instance/logout/${encodeURIComponent(name)}`, { method: "DELETE" });
  await evoFetch(`/instance/delete/${encodeURIComponent(name)}`, { method: "DELETE" }).catch(() => {});
  return { ok: res.success, error: res.error };
}

// ==========================================
// DRAIN DE COLA CON ESPACIADO Y REINTENTOS
// ==========================================
async function sendTextRaw(instanceName: string, phone: string, text: string) {
  // Simular presencia de escritura previa (delay de 2s) para comportamiento 100% natural
  return evoFetch(`/message/sendText/${encodeURIComponent(instanceName)}`, {
    method: "POST",
    body: JSON.stringify({
      number: phone,
      text,
      delay: 2000,
    }),
  });
}

function isRetryableStatus(status?: number): boolean {
  if (!status) return true;
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

async function drainWaQueue(instanceName: string) {
  if (waDraining.get(instanceName)) return;
  waDraining.set(instanceName, true);

  try {
    while (true) {
      const q = waQueues.get(instanceName);
      if (!q?.length) break;

      const job = q.shift()!;
      const last = waLastSentAt.get(instanceName) || 0;
      const targetGap = BASE_QUEUE_GAP_MS + getRandomJitterMs();
      const wait = targetGap - (Date.now() - last);

      if (wait > 0) {
        await sleep(wait);
      }

      // Comprobar guardarraíl de volumen por hora
      if (!checkHourlyRateLimit(instanceName)) {
        console.warn(`[whatsapp] Rate limit horario alcanzado para ${instanceName}`);
        job.resolve({
          ok: false,
          sent: false,
          error: "Guardarraíl anti-bloqueo: Límite de mensajes por hora alcanzado. Espere unos minutos.",
        });
        continue;
      }

      const result = await sendTextRaw(job.instanceName, job.phone, job.text);

      if (result.success) {
        waLastSentAt.set(instanceName, Date.now());
        const msgId = result.data?.key?.id;
        job.resolve({ ok: true, sent: true, messageId: msgId });
        continue;
      }

      const retryable = isRetryableStatus(result.status);
      if (retryable && job.attempt + 1 < MAX_SEND_ATTEMPTS) {
        const next = job.attempt + 1;
        const backoff = RETRY_BACKOFF_MS[Math.min(next, RETRY_BACKOFF_MS.length - 1)];
        console.warn(
          `[whatsapp] Reintento en cola ${instanceName} intento=${next} status=${result.status}`
        );
        await sleep(backoff);
        q.unshift({ ...job, attempt: next });
        continue;
      }

      console.warn(`[whatsapp] Falló envío: status=${result.status} error=${result.error}`);
      job.resolve({ ok: false, sent: false, error: result.error || `Error HTTP ${result.status || 500}` });
    }
  } finally {
    waDraining.set(instanceName, false);
    const leftover = waQueues.get(instanceName);
    if (leftover?.length) {
      void drainWaQueue(instanceName);
    }
  }
}

export async function sendWhatsAppMessage(
  to: string,
  body: string,
  instanceName?: string
): Promise<WhatsAppSendResult> {
  const creds = resolveEvoCreds();
  const number = normalizeEvoPhone(to);
  if (!number) {
    return { ok: false, sent: false, error: "Número de celular inválido (809/829/849)" };
  }

  const instance = instanceName?.trim() || process.env.EVOLUTION_INSTANCE || "forms";

  if (!creds) {
    return {
      ok: true,
      sent: false,
      manualUrl: whatsAppClickUrl(to, body),
      error: "Evolution API no configurada",
      provider: "manual",
    };
  }

  // 1) Guardarraíl de Idempotencia y Deduplicación (90s)
  const dedup = waDedupKey(instance, number, body);
  const recent = waRecentKeys.get(dedup);
  if (recent && Date.now() - recent < DEDUP_TTL_MS) {
    return { ok: true, sent: true, provider: "evolution" };
  }
  waRecentKeys.set(dedup, Date.now());

  // Limpieza periódica del mapa de deduplicación
  if (waRecentKeys.size > 1000) {
    const cutoff = Date.now() - DEDUP_TTL_MS;
    for (const [k, t] of waRecentKeys) {
      if (t < cutoff) waRecentKeys.delete(k);
    }
  }

  // 2) Guardarraíl de tamaño de cola por instancia
  const q = waQueues.get(instance) || [];
  if (q.length >= MAX_QUEUE_PER_INSTANCE) {
    return {
      ok: false,
      sent: false,
      manualUrl: whatsAppClickUrl(number, body),
      error: "Cola de envíos de WhatsApp llena. Intenta de nuevo en un momento.",
      provider: "manual",
    };
  }

  // 3) Encolar y procesar con ritmo humano
  return new Promise<WhatsAppSendResult>((resolve) => {
    q.push({
      instanceName: instance,
      phone: number,
      text: body,
      attempt: 0,
      resolve: (res) => {
        if (res.ok && res.sent) {
          resolve({
            ok: true,
            sent: true,
            provider: "evolution",
            messageId: res.messageId,
          });
        } else {
          resolve({
            ok: false,
            sent: false,
            manualUrl: whatsAppClickUrl(number, body),
            error: res.error,
            provider: "manual",
          });
        }
      },
    });

    waQueues.set(instance, q);
    void drainWaQueue(instance);
  });
}

export async function logNotification(params: {
  submissionId: string;
  type: string;
  status: string;
  payload?: Record<string, unknown>;
  error?: string;
}) {
  await prisma.notificationLog.create({
    data: {
      submissionId: params.submissionId,
      channel: "whatsapp",
      type: params.type,
      status: params.status,
      payload: (params.payload ?? undefined) as unknown as Prisma.InputJsonValue | undefined,
      error: params.error,
    },
  });
}

export async function notifyCandidateWhatsApp(params: {
  submissionId: string;
  phone: string;
  type: "aceptacion" | "entrevista";
  body: string;
  instanceName?: string;
}): Promise<WhatsAppSendResult> {
  const result = await sendWhatsAppMessage(params.phone, params.body, params.instanceName);
  await logNotification({
    submissionId: params.submissionId,
    type: params.type,
    status: result.sent ? "sent" : result.manualUrl ? "manual" : "failed",
    payload: {
      provider: result.provider,
      manualUrl: result.manualUrl,
      messageId: result.messageId,
      instanceName: params.instanceName,
    },
    error: result.error,
  });
  return result;
}
