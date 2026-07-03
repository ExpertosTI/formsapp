import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionContext } from "@/lib/session";
import { isHexColor } from "@/lib/tenant-branding";
import type { TenantSettings, ThemeMode } from "@/lib/form-config";

const LOGOS_DIR = path.join(process.cwd(), "public", "uploads", "logos");
const ALLOWED_LOGO_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_LOGO_BYTES = 2 * 1024 * 1024;

async function assertTenantAccess(slug: string) {
  const { isSuperAdmin, tenantSlug } = await getSessionContext();
  if (!isSuperAdmin && !tenantSlug) {
    return { ok: false as const, status: 401, error: "No autorizado" };
  }
  if (!isSuperAdmin && tenantSlug !== slug) {
    return { ok: false as const, status: 403, error: "Sin permiso" };
  }
  return { ok: true as const, isSuperAdmin };
}

function deleteManagedLogo(logoPath: string | null | undefined) {
  if (!logoPath || !logoPath.startsWith("uploads/logos/")) return;
  const full = path.join(process.cwd(), "public", logoPath);
  if (fs.existsSync(full) && fs.statSync(full).isFile()) {
    try {
      fs.unlinkSync(full);
    } catch {
      /* ignore */
    }
  }
}

async function saveLogo(file: File, slug: string): Promise<string> {
  if (!ALLOWED_LOGO_TYPES.has(file.type)) {
    throw new Error("Logo debe ser JPG, PNG, WEBP o GIF");
  }
  if (file.size > MAX_LOGO_BYTES) {
    throw new Error("Logo máximo 2 MB");
  }

  const ext =
    file.type === "image/png"
      ? ".png"
      : file.type === "image/webp"
        ? ".webp"
        : file.type === "image/gif"
          ? ".gif"
          : ".jpg";

  fs.mkdirSync(LOGOS_DIR, { recursive: true });
  const filename = `${slug}_${Date.now().toString(36)}${ext}`;
  const dest = path.join(LOGOS_DIR, filename);
  const buf = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(dest, buf);
  return `uploads/logos/${filename}`;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const access = await assertTenantAccess(slug);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      logo: true,
      senderName: true,
      primaryColor: true,
      accentColor: true,
      backgroundColor: true,
      settings: true,
      adminEmail: true,
      active: true,
    },
  });

  if (!tenant) {
    return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 });
  }

  return NextResponse.json(tenant);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const access = await assertTenantAccess(slug);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) {
    return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 });
  }

  try {
    const formData = await req.formData();
    const name = String(formData.get("name") ?? "").trim();
    const senderName = String(formData.get("senderName") ?? "").trim();
    const primaryColor = String(formData.get("primaryColor") ?? "").trim();
    const accentColor = String(formData.get("accentColor") ?? "").trim();
    const backgroundColor = String(formData.get("backgroundColor") ?? "").trim();
    const introText = String(formData.get("introText") ?? "").trim();
    const themeModeRaw = String(formData.get("themeMode") ?? "").trim();
    const removeLogo = String(formData.get("removeLogo") ?? "") === "1";
    const logoFile = formData.get("logo");

    if (!name || name.length < 2) {
      return NextResponse.json({ error: "Nombre de empresa requerido" }, { status: 400 });
    }

    for (const [label, color] of [
      ["Color principal", primaryColor],
      ["Color acento", accentColor],
      ["Color de fondo", backgroundColor],
    ] as const) {
      if (color && !isHexColor(color)) {
        return NextResponse.json({ error: `${label} inválido` }, { status: 400 });
      }
    }

    const themeModes: ThemeMode[] = ["dark", "light", "system"];
    const themeMode = themeModes.includes(themeModeRaw as ThemeMode)
      ? (themeModeRaw as ThemeMode)
      : undefined;

    const prevSettings = (tenant.settings ?? {}) as TenantSettings;
    const settings: TenantSettings = {
      ...prevSettings,
      introText: introText || undefined,
      ...(themeMode ? { themeMode } : {}),
    };

    let logo = tenant.logo;
    if (removeLogo) {
      deleteManagedLogo(tenant.logo);
      logo = null;
    } else if (logoFile instanceof File && logoFile.size > 0) {
      const stored = await saveLogo(logoFile, slug);
      deleteManagedLogo(tenant.logo);
      logo = stored;
    }

    const updated = await prisma.tenant.update({
      where: { slug },
      data: {
        name,
        senderName: senderName || null,
        primaryColor: primaryColor || tenant.primaryColor,
        accentColor: accentColor || tenant.accentColor,
        backgroundColor: backgroundColor || tenant.backgroundColor,
        logo,
        settings: settings as Prisma.InputJsonValue,
      },
      select: {
        slug: true,
        name: true,
        logo: true,
        senderName: true,
        primaryColor: true,
        accentColor: true,
        backgroundColor: true,
        settings: true,
      },
    });

    return NextResponse.json({ ok: true, tenant: updated });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error al guardar";
    console.error("update tenant", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
