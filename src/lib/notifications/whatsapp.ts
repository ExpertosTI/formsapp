import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getEvoConfig } from "./evo";
import { normalizeEvoPhone, whatsAppClickUrl } from "./phone";

export interface WhatsAppSendResult {
  ok: boolean;
  sent: boolean;
  manualUrl?: string;
  error?: string;
  provider?: "evolution" | "manual";
  messageId?: string;
}

async function sendViaEvolution(to: string, body: string): Promise<WhatsAppSendResult> {
  const cfg = getEvoConfig();
  if (!cfg) {
    return {
      ok: true,
      sent: false,
      manualUrl: whatsAppClickUrl(to, body),
      error: "Evolution API no configurada en .env",
      provider: "manual",
    };
  }

  const number = normalizeEvoPhone(to);
  if (!number) {
    return { ok: false, sent: false, error: "Número de celular inválido (809/829/849)" };
  }

  const url = `${cfg.baseUrl}/message/sendText/${encodeURIComponent(cfg.instance)}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: cfg.apiKey,
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

export async function sendWhatsAppMessage(to: string, body: string): Promise<WhatsAppSendResult> {
  return sendViaEvolution(to, body);
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
}): Promise<WhatsAppSendResult> {
  const result = await sendWhatsAppMessage(params.phone, params.body);
  await logNotification({
    submissionId: params.submissionId,
    type: params.type,
    status: result.sent ? "sent" : result.manualUrl ? "manual" : "failed",
    payload: {
      provider: result.provider,
      manualUrl: result.manualUrl,
      messageId: result.messageId,
    },
    error: result.error,
  });
  return result;
}
