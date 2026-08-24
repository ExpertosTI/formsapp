import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionContext } from "@/lib/session";
import { isHexColor } from "@/lib/tenant-branding";
import { deleteManagedLogo, saveLogo } from "@/lib/tenant-logos";
import type { TenantSettings, ThemeMode } from "@/lib/form-config";

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

function parseJsonSafe<T>(raw: unknown): T | undefined {
  if (typeof raw !== "string" || !raw.trim()) return undefined;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
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
    const formTypeRaw = String(formData.get("formType") ?? "").trim();
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
    const formType =
      formTypeRaw === "full" || formTypeRaw === "simple" || formTypeRaw === "custom"
        ? formTypeRaw
        : undefined;

    const sections = parseJsonSafe<Record<string, boolean>>(formData.get("sections"));
    const fields = parseJsonSafe<Record<string, boolean>>(formData.get("fields"));
    const customLabels = parseJsonSafe<Record<string, string>>(formData.get("customLabels"));
    const customPlaceholders = parseJsonSafe<Record<string, string>>(formData.get("customPlaceholders"));
    const customOptions = parseJsonSafe<Record<string, string[]>>(formData.get("customOptions"));
    const customQuestions = parseJsonSafe<any[]>(formData.get("customQuestions"));

    const notifyOnSubmissionRaw = formData.get("notifyOnSubmission");
    const notifyOnSubmission =
      notifyOnSubmissionRaw != null ? String(notifyOnSubmissionRaw) === "1" || String(notifyOnSubmissionRaw) === "true" : undefined;
    const adminNotifyPhone = String(formData.get("adminNotifyPhone") ?? "").trim();

    const fullSettingsPayload = parseJsonSafe<TenantSettings>(formData.get("fullSettings"));

    const prevSettings = (tenant.settings ?? {}) as TenantSettings;
    const settings: TenantSettings = {
      ...prevSettings,
      ...(fullSettingsPayload || {}),
      introText: introText !== undefined ? introText : prevSettings.introText,
      ...(themeMode ? { themeMode } : {}),
      ...(formType ? { formType } : {}),
      ...(sections !== undefined ? { sections } : {}),
      ...(fields !== undefined ? { fields } : {}),
      ...(customLabels !== undefined ? { customLabels } : {}),
      ...(customPlaceholders !== undefined ? { customPlaceholders } : {}),
      ...(customOptions !== undefined ? { customOptions } : {}),
      ...(customQuestions !== undefined ? { customQuestions } : {}),
      ...(notifyOnSubmission !== undefined ? { notifyOnSubmission } : {}),
      ...(adminNotifyPhone ? { adminNotifyPhone } : {}),
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
        settings: settings as unknown as Prisma.InputJsonValue,
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
