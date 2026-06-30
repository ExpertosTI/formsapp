import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSessionContext } from "@/lib/session";
import { isValidSlug, slugify } from "@/lib/slug";

export async function POST(req: NextRequest) {
  const { isSuperAdmin } = await getSessionContext();
  if (!isSuperAdmin) {
    return NextResponse.json({ error: "Solo super admin" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const name = String(body.name ?? "").trim();
    const slugRaw = String(body.slug ?? slugify(name)).trim().toLowerCase();
    const adminEmail = String(body.adminEmail ?? "").trim().toLowerCase();
    const adminPassword = String(body.adminPassword ?? "");
    const primaryColor = String(body.primaryColor ?? "#1b2055").trim();
    const accentColor = String(body.accentColor ?? "#2dd4bf").trim();

    if (!name || name.length < 2) {
      return NextResponse.json({ error: "Nombre de empresa requerido" }, { status: 400 });
    }
    if (!isValidSlug(slugRaw)) {
      return NextResponse.json({ error: "Slug inválido (solo letras, números y guiones)" }, { status: 400 });
    }
    if (!adminEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
      return NextResponse.json({ error: "Correo admin inválido" }, { status: 400 });
    }
    if (adminPassword.length < 8) {
      return NextResponse.json({ error: "Contraseña mínimo 8 caracteres" }, { status: 400 });
    }

    const exists = await prisma.tenant.findFirst({
      where: { OR: [{ slug: slugRaw }, { adminEmail }] },
    });
    if (exists) {
      return NextResponse.json({ error: "Slug o correo ya registrado" }, { status: 409 });
    }

    const hash = await bcrypt.hash(adminPassword, 12);
    const tenant = await prisma.tenant.create({
      data: {
        name,
        slug: slugRaw,
        adminEmail,
        adminPassword: hash,
        primaryColor,
        accentColor,
        active: true,
        settings: {},
      },
    });

    return NextResponse.json({
      ok: true,
      slug: tenant.slug,
      formUrl: `/forms/${tenant.slug}`,
    });
  } catch (e) {
    console.error("create tenant", e);
    return NextResponse.json({ error: "Error al crear empresa" }, { status: 500 });
  }
}
