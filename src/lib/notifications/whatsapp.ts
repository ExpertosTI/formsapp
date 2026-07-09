import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { normalizeWhatsAppPhone, whatsAppClickUrl } from "./phone";

export interface WhatsAppSendResult {
  ok: boolean;
  sent: boolean;
  manualUrl?: string;
  error?: string;
  sid?: string;
}

export async function sendWhatsAppMessage(to: string, body: string): Promise<WhatsAppSendResult> {
  const e164 = normalizeWhatsAppPhone(to);
  if (!e164) {
    return { ok: false, sent: false, error: "Número de celular inválido para WhatsApp (809/829/849)" };
  }

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;

  if (!sid || !token || !from) {
    return {
      ok: true,
      sent: false,
      manualUrl: whatsAppClickUrl(e164, body),
      error: "API de WhatsApp no configurada — usa el enlace manual",
    };
  }

  try {
    const auth = Buffer.from(`${sid}:${token}`).toString("base64");
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: from.startsWith("whatsapp:") ? from : `whatsapp:${from}`,
        To: `whatsapp:${e164}`,
        Body: body,
      }),
    });

    const data = (await res.json()) as { sid?: string; message?: string };
    if (!res.ok) {
      return {
        ok: false,
        sent: false,
        manualUrl: whatsAppClickUrl(e164, body),
        error: data.message ?? `Twilio error ${res.status}`,
      };
    }

    return { ok: true, sent: true, sid: data.sid };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al enviar WhatsApp";
    return {
      ok: false,
      sent: false,
      manualUrl: whatsAppClickUrl(e164, body),
      error: msg,
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
}): Promise<WhatsAppSendResult> {
  const result = await sendWhatsAppMessage(params.phone, params.body);
  await logNotification({
    submissionId: params.submissionId,
    type: params.type,
    status: result.sent ? "sent" : result.manualUrl ? "manual" : "failed",
    payload: { manualUrl: result.manualUrl, sid: result.sid },
    error: result.error,
  });
  return result;
}
