import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSessionContext } from "@/lib/session";
import { isValidSlug, slugify } from "@/lib/slug";
import { isHexColor } from "@/lib/tenant-branding";
import { saveLogo } from "@/lib/tenant-logos";

export async function POST(req: NextRequest) {
  const { isSuperAdmin } = await getSessionContext();
  if (!isSuperAdmin) {
    return NextResponse.json({ error: "Solo super admin" }, { status: 403 });
  }

  try {
    const contentType = req.headers.get("content-type") ?? "";
    let name: string;
    let slugRaw: string;
    let adminEmail: string;
    let adminPassword: string;
    let primaryColor: string;
    let accentColor: string;
    let backgroundColor: string;
    let logoFile: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      name = String(formData.get("name") ?? "").trim();
      slugRaw = String(formData.get("slug") ?? slugify(name)).trim().toLowerCase();
      adminEmail = String(formData.get("adminEmail") ?? "").trim().toLowerCase();
      adminPassword = String(formData.get("adminPassword") ?? "");
      primaryColor = String(formData.get("primaryColor") ?? "#1b2055").trim();
      accentColor = String(formData.get("accentColor") ?? "#2dd4bf").trim();
      backgroundColor = String(formData.get("backgroundColor") ?? "#0f172a").trim();
      const file = formData.get("logo");
      if (file instanceof File && file.size > 0) logoFile = file;
    } else {
      const body = await req.json();
      name = String(body.name ?? "").trim();
      slugRaw = String(body.slug ?? slugify(name)).trim().toLowerCase();
      adminEmail = String(body.adminEmail ?? "").trim().toLowerCase();
      adminPassword = String(body.adminPassword ?? "");
      primaryColor = String(body.primaryColor ?? "#1b2055").trim();
      accentColor = String(body.accentColor ?? "#2dd4bf").trim();
      backgroundColor = String(body.backgroundColor ?? "#0f172a").trim();
    }

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

    for (const [label, color] of [
      ["Color principal", primaryColor],
      ["Color acento", accentColor],
      ["Color de contraste", backgroundColor],
    ] as const) {
      if (color && !isHexColor(color)) {
        return NextResponse.json({ error: `${label} inválido` }, { status: 400 });
      }
    }

    const exists = await prisma.tenant.findFirst({
      where: { OR: [{ slug: slugRaw }, { adminEmail }] },
    });
    if (exists) {
      return NextResponse.json({ error: "Slug o correo ya registrado" }, { status: 409 });
    }

    let logo: string | null = null;
    if (logoFile) {
      logo = await saveLogo(logoFile, slugRaw);
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
        backgroundColor,
        logo,
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
    const message = e instanceof Error ? e.message : "Error al crear empresa";
    console.error("create tenant", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
