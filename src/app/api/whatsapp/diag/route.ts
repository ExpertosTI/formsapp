import { NextRequest, NextResponse } from "next/server";
import { getSessionContext } from "@/lib/session";
import {
  evolutionApiKey,
  evolutionApiUrl,
  getWhatsAppConfigStatus,
  whatsappConfigured,
} from "@/lib/notifications/evo";

export async function GET(req: NextRequest) {
  const session = await getSessionContext();
  if (!session.isSuperAdmin && !session.tenantSlug) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const status = getWhatsAppConfigStatus();
  if (!whatsappConfigured()) {
    return NextResponse.json({
      ok: false,
      configured: false,
      message: "Sin EVOLUTION_API_KEY en el contenedor o servidor (.evolution.local / env)",
    });
  }

  const url = evolutionApiUrl();
  const key = evolutionApiKey();
  const keyLen = key.length;

  let probeStatus = 0;
  let probeOk = false;
  let probeBody = "";
  let instanceCount: number | null = null;
  let canCreate = false;
  let createStatus = 0;

  try {
    const res = await fetch(`${url}/instance/fetchInstances`, {
      headers: { apikey: key, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(15_000),
    });
    probeStatus = res.status;
    probeOk = res.ok;
    const text = await res.text().catch(() => "");
    probeBody = text.slice(0, 150).replace(/[0-9a-fA-F-]{20,}/g, "[redacted]");
    if (res.ok) {
      try {
        const data = JSON.parse(text);
        const list = Array.isArray(data) ? data : data?.data || data?.instance || [];
        instanceCount = Array.isArray(list) ? list.length : null;
      } catch {}
    }
  } catch (err) {
    probeBody = err instanceof Error ? err.message.slice(0, 120) : "network_error";
  }

  if (probeOk) {
    try {
      const probeName = `app-probe-${Date.now().toString(36)}`;
      const cres = await fetch(`${url}/instance/create`, {
        method: "POST",
        headers: { apikey: key, "Content-Type": "application/json" },
        body: JSON.stringify({
          instanceName: probeName,
          qrcode: true,
          integration: "WHATSAPP-BAILEYS",
        }),
        signal: AbortSignal.timeout(15_000),
      });
      createStatus = cres.status;
      canCreate =
        cres.status === 201 ||
        cres.status === 200 ||
        cres.status === 403 ||
        cres.status === 409;
      if (cres.status === 401) canCreate = false;
      if (cres.status === 201 || cres.status === 200) {
        await fetch(`${url}/instance/delete/${encodeURIComponent(probeName)}`, {
          method: "DELETE",
          headers: { apikey: key },
          signal: AbortSignal.timeout(10_000),
        }).catch(() => null);
      }
    } catch {
      createStatus = 0;
    }
  }

  let hint = "";
  if (!probeOk) {
    hint =
      probeStatus === 401
        ? "API Key rechazada por Evolution API. Usa la AUTHENTICATION_API_KEY global del servidor."
        : `Evolution no respondió correctamente (HTTP ${probeStatus || "error de red"}).`;
  } else if (!canCreate && createStatus === 401) {
    hint =
      "La API Key lista instancias pero NO tiene permisos para CREAR (HTTP 401). Debes usar la AUTHENTICATION_API_KEY global de Evolution API.";
  } else if (!canCreate) {
    hint = `Create respondió HTTP ${createStatus || "—"}. Revisa la configuración de Evolution API.`;
  } else {
    hint = `Evolution API OK (Key global de ${keyLen} caracteres). Listo para generar QR.`;
  }

  return NextResponse.json({
    ok: probeOk && canCreate,
    configured: true,
    apiHost: (() => {
      try {
        return new URL(url).host;
      } catch {
        return url;
      }
    })(),
    keyLen,
    source: "source" in status ? status.source : "unknown",
    probeStatus,
    probeOk,
    createStatus,
    canCreate,
    instanceCount,
    hint,
    detail: probeBody || undefined,
  });
}
