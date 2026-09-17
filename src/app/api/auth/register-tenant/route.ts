import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isValidSlug, slugify } from "@/lib/slug";
import { normalizeWhatsAppPhone } from "@/lib/notifications/phone";
import { AUTH_COOKIE, TENANT_COOKIE } from "@/lib/auth-constants";
import { tenantSessionToken } from "@/lib/session";
import { sendWhatsAppMessage } from "@/lib/notifications/whatsapp";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = String(body.name ?? "").trim();
    const adminEmail = String(body.adminEmail ?? body.email ?? "").trim().toLowerCase();
    const adminPassword = String(body.adminPassword ?? body.password ?? "");
    const whatsappRaw = String(body.whatsapp ?? body.phone ?? "").trim();
    const slugRaw = String(body.slug ?? slugify(name)).trim().toLowerCase();

    if (!name || name.length < 2) {
      return NextResponse.json({ error: "Nombre de empresa requerido" }, { status: 400 });
    }
    if (!isValidSlug(slugRaw)) {
      return NextResponse.json({ error: "Nombre inválido para la URL de tu formulario" }, { status: 400 });
    }
    if (!adminEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
      return NextResponse.json({ error: "Correo inválido" }, { status: 400 });
    }
    if (adminPassword.length < 8) {
      return NextResponse.json({ error: "Contraseña mínimo 8 caracteres" }, { status: 400 });
    }

    const whatsapp = normalizeWhatsAppPhone(whatsappRaw);
    if (!whatsapp) {
      return NextResponse.json(
        { error: "WhatsApp inválido. Usa un celular RD (809, 829 o 849)." },
        { status: 400 }
      );
    }

    const exists = await prisma.tenant.findFirst({
      where: { OR: [{ slug: slugRaw }, { adminEmail }] },
    });
    if (exists) {
      return NextResponse.json(
        { error: "Esa empresa o correo ya está registrado. Inicia sesión." },
        { status: 409 }
      );
    }

    const hash = await bcrypt.hash(adminPassword, 12);
    const tenant = await prisma.tenant.create({
      data: {
        name,
        slug: slugRaw,
        adminEmail,
        adminPassword: hash,
        active: true,
        settings: {
          formType: "simple",
          adminNotifyPhone: whatsapp,
          notifyOnSubmission: true,
          registeredVia: "public-whatsapp",
        },
      },
    });

    const welcome =
      `¡Bienvenido a TalentoLink!\n\n` +
      `Tu empresa *${tenant.name}* ya está lista.\n` +
      `Panel: https://forms.renace.tech/admin/login\n` +
      `Formulario: https://forms.renace.tech/forms/${tenant.slug}\n\n` +
      `Entra con tu correo y contraseña.`;
    void sendWhatsAppMessage(whatsapp, welcome);

    const res = NextResponse.json({
      ok: true,
      slug: tenant.slug,
      formUrl: `/forms/${tenant.slug}`,
    });
    res.cookies.delete(AUTH_COOKIE);
    res.cookies.set(TENANT_COOKIE, tenantSessionToken(tenant.slug), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (e) {
    console.error("register-tenant", e);
    return NextResponse.json({ error: "No se pudo registrar la empresa" }, { status: 500 });
  }
}
