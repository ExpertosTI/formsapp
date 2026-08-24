import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { resolveEvoCreds, tenantInstanceName, whatsappConfigured } from "./evo";
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

async function evoFetch(route: string, options: RequestInit = {}): Promise<EvoResult> {
  const creds = resolveEvoCreds();
  if (!creds) {
    return { success: false, error: "Evolution API no configurada" };
  }

  try {
    const res = await fetch(`${creds.url}${route}`, {
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
      const msg = data?.message ?? data?.error ?? data?.response?.message ?? `HTTP ${res.status}`;
      const errStr = Array.isArray(msg) ? msg.join(", ") : String(msg);
      return { success: false, error: errStr, data, status: res.status };
    }
    return { success: true, data, status: res.status };
  } catch (err) {
    const message = err instanceof Error ? err.message : "network_error";
    return { success: false, error: message };
  }
}

function extractQr(data: any): string | null {
  const candidates = [
    data?.qrcode?.base64,
    data?.base64,
    data?.qr?.base64,
    typeof data?.qrcode === "string" ? data.qrcode : null,
  ];
  for (const raw of candidates) {
    if (typeof raw !== "string") continue;
    const cleaned = raw.replace(/^data:image\/[a-zA-Z+]+;base64,/, "");
    if (cleaned.length < 80) continue;
    return raw.startsWith("data:") ? raw : `data:image/png;base64,${cleaned}`;
  }
  return null;
}

function extractState(data: any): string {
  return String(
    data?.instance?.state || data?.state || data?.connectionState || data?.status || "unknown"
  ).toLowerCase();
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
      error: result.error,
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
  if (!name) {
    return { ok: false, instanceName: name, qrcode: null, error: "Nombre de instancia inválido" };
  }

  // 1) Verificar si ya está conectada
  const live = await getEvolutionConnectionState(name);
  if (live.state === "open") {
    return {
      ok: true,
      instanceName: name,
      qrcode: null,
      alreadyConnected: true,
    };
  }

  // 2) Crear instancia si no existe
  const created = await evoFetch("/instance/create", {
    method: "POST",
    body: JSON.stringify({
      instanceName: name,
      qrcode: true,
      integration: "WHATSAPP-BAILEYS",
    }),
  });

  if (created.success) {
    const qrCreate = extractQr(created.data);
    if (qrCreate) {
      return { ok: true, instanceName: name, qrcode: qrCreate };
    }
  }

  // 3) Conectar y solicitar QR
  const conn = await evoFetch(`/instance/connect/${encodeURIComponent(name)}`);
  if (conn.success) {
    const qr = extractQr(conn.data);
    if (qr) {
      return { ok: true, instanceName: name, qrcode: qr };
    }
  }

  return {
    ok: false,
    instanceName: name,
    qrcode: null,
    error: created.error || conn.error || "No se pudo generar el código QR",
  };
}

export async function disconnectWhatsAppSession(instanceName: string) {
  const name = instanceName.trim();
  if (!name) return { ok: false, error: "Sin instancia" };
  const res = await evoFetch(`/instance/logout/${encodeURIComponent(name)}`, { method: "DELETE" });
  await evoFetch(`/instance/delete/${encodeURIComponent(name)}`, { method: "DELETE" }).catch(() => {});
  return { ok: res.success, error: res.error };
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

  const url = `${creds.url}/message/sendText/${encodeURIComponent(instance)}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: creds.key,
      },
      body: JSON.stringify({ number, text: body }),
    });

    const data = (await res.json().catch(() => ({}))) as {
      key?: { id?: string };
      message?: string;
      error?: string;
      response?: { message?: string };
    };

    if (!res.ok) {
      const errMsg =
        data.message ?? data.error ?? data.response?.message ?? `Evolution API error ${res.status}`;
      return {
        ok: false,
        sent: false,
        manualUrl: whatsAppClickUrl(number, body),
        error: errMsg,
        provider: "manual",
      };
    }

    return {
      ok: true,
      sent: true,
      provider: "evolution",
      messageId: data.key?.id,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al conectar con Evolution API";
    return {
      ok: false,
      sent: false,
      manualUrl: whatsAppClickUrl(number, body),
      error: msg,
      provider: "manual",
    };
  }
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
      payload: (params.payload ?? undefined) as Prisma.InputJsonValue | undefined,
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
