import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionContext } from "@/lib/session";
import { tenantInstanceName, whatsappConfigured } from "@/lib/notifications/evo";
import {
  disconnectWhatsAppSession,
  getEvolutionConnectionState,
  sendWhatsAppMessage,
  startWhatsAppSession,
} from "@/lib/notifications/whatsapp";
import type { TenantSettings } from "@/lib/form-config";
import { Prisma } from "@prisma/client";

async function checkAuthAndTenant(slug?: string | null) {
  const session = await getSessionContext();
  const targetSlug = slug || session.tenantSlug;

  if (!session.isSuperAdmin && !session.tenantSlug) {
    return { ok: false as const, status: 401, error: "No autenticado" };
  }
  if (!session.isSuperAdmin && session.tenantSlug !== targetSlug) {
    return { ok: false as const, status: 403, error: "Sin permiso para esta empresa" };
  }
  if (!targetSlug) {
    return { ok: false as const, status: 400, error: "Slug de empresa requerido" };
  }

  const tenant = await prisma.tenant.findUnique({ where: { slug: targetSlug } });
  if (!tenant) {
    return { ok: false as const, status: 404, error: "Empresa no encontrada" };
  }

  return { ok: true as const, tenant, session };
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");
  const wantQr = url.searchParams.get("qr") === "1";

  const auth = await checkAuthAndTenant(slug);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { tenant } = auth;
  const settings = (tenant.settings ?? {}) as TenantSettings;

  if (!whatsappConfigured()) {
    return NextResponse.json({
      ok: true,
      configured: false,
      connected: false,
      state: "not_configured",
      message: "Evolution API no está configurada en el servidor.",
    });
  }

  const instance = settings.whatsappInstance || tenantInstanceName(tenant.slug);
  const stateResult = await getEvolutionConnectionState(instance);

  if (!wantQr) {
    const isConnected = stateResult.state === "open";
    return NextResponse.json({
      ok: true,
      configured: true,
      connected: isConnected,
      state: stateResult.state,
      instance,
      tip: isConnected
        ? undefined
        : "Pulsa 'Mostrar código QR' y escanea con la aplicación de WhatsApp de tu empresa.",
    });
  }

  // Si se solicita el QR
  if (stateResult.state === "open") {
    // Asegurar que la instancia quede guardada en settings
    if (settings.whatsappInstance !== instance) {
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          settings: { ...settings, whatsappInstance: instance } as Prisma.InputJsonValue,
        },
      });
    }
    return NextResponse.json({
      ok: true,
      configured: true,
      connected: true,
      state: "open",
      instance,
      qr: null,
      message: "Tu WhatsApp ya está vinculado y activo.",
    });
  }

  const sessionResult = await startWhatsAppSession(instance);
  if (sessionResult.ok && "alreadyConnected" in sessionResult && sessionResult.alreadyConnected) {
    if (settings.whatsappInstance !== instance) {
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          settings: { ...settings, whatsappInstance: instance } as Prisma.InputJsonValue,
        },
      });
    }
    return NextResponse.json({
      ok: true,
      configured: true,
      connected: true,
      state: "open",
      instance,
      qr: null,
      message: "WhatsApp vinculado exitosamente.",
    });
  }

  if (sessionResult.ok && sessionResult.qrcode) {
    if (settings.whatsappInstance !== instance) {
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          settings: { ...settings, whatsappInstance: instance } as Prisma.InputJsonValue,
        },
      });
    }
    return NextResponse.json({
      ok: true,
      configured: true,
      connected: false,
      state: "connecting",
      instance,
      qr: sessionResult.qrcode,
      tip: "Abre WhatsApp en tu teléfono > Dispositivos vinculados > Vincular un dispositivo.",
    });
  }

  return NextResponse.json({
    ok: false,
    configured: true,
    connected: false,
    state: stateResult.state,
    instance,
    error: sessionResult.error || "No se pudo generar el código QR",
    tip: "Espera unos segundos y vuelve a intentar.",
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slug, action, phone, message } = body;

    const auth = await checkAuthAndTenant(slug);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { tenant } = auth;
    const settings = (tenant.settings ?? {}) as TenantSettings;
    const instance = settings.whatsappInstance || tenantInstanceName(tenant.slug);

    if (action === "disconnect") {
      await disconnectWhatsAppSession(instance);
      const updatedSettings: TenantSettings = {
        ...settings,
        whatsappInstance: undefined,
        whatsappToken: undefined,
      };

      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { settings: updatedSettings as Prisma.InputJsonValue },
      });

      return NextResponse.json({ ok: true, message: "WhatsApp desvinculado correctamente" });
    }

    if (action === "test") {
      if (!phone) {
        return NextResponse.json({ error: "Número de teléfono requerido" }, { status: 400 });
      }
      const testMsg =
        message ||
        `¡Hola! Este es un mensaje de prueba de ${tenant.name} desde TalentoLink. Tu WhatsApp está conectado correctamente.`;

      const result = await sendWhatsAppMessage(phone, testMsg, instance);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 });
  } catch (e) {
    const err = e instanceof Error ? e.message : "Error en servidor";
    return NextResponse.json({ error: err }, { status: 500 });
  }
}
