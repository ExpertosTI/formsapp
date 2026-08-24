import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { buildFormSections, type TenantSettings } from "@/lib/form-config";
import { computeCandidateScore, type FormTelemetry } from "@/lib/scoring";
import { sendWhatsAppMessage } from "@/lib/notifications/whatsapp";

const UPLOADS = path.join(process.cwd(), "public", "uploads");

function makeId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 9)}`;
}

async function saveUpload(file: File, key: string): Promise<string> {
  const ext = path.extname(file.name) || "";
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
  const filename = `${Date.now()}_${key}_${safe || `file${ext}`}`;
  const dest = path.join(UPLOADS, filename);
  fs.mkdirSync(UPLOADS, { recursive: true });
  const buf = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(dest, buf);
  return filename;
}

function parseTelemetry(raw: unknown): FormTelemetry | undefined {
  if (typeof raw !== "string" || !raw.trim()) return undefined;
  try {
    return JSON.parse(raw) as FormTelemetry;
  } catch {
    return undefined;
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const slug = String(formData.get("tenant_slug") ?? "").trim();
    if (!slug) {
      return NextResponse.json({ error: "tenant_slug requerido" }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({ where: { slug } });
    if (!tenant || !tenant.active) {
      return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 });
    }

    const settings = (tenant.settings ?? {}) as TenantSettings;
    const sections = buildFormSections(settings);
    const datos: Record<string, string> = {};
    const archivos: Record<string, string> = {};
    const telemetry = parseTelemetry(formData.get("_telemetry"));

    for (const section of sections) {
      for (const field of section.fields) {
        if (field.type === "location") {
          for (const key of ["provincia", "ciudad", "sector", "direccion"]) {
            const val = formData.get(key);
            const s = val != null ? String(val).trim() : "";
            if (!s && field.required) {
              return NextResponse.json({ error: `Completa tu ubicación (${key})` }, { status: 400 });
            }
            if (s) datos[key] = s;
          }
          continue;
        }
        if (field.key.startsWith("_")) continue;
        const val = formData.get(field.key);
        if (field.type === "file") {
          if (val instanceof File && val.size > 0) {
            archivos[field.key] = await saveUpload(val, field.key);
          } else if (field.required) {
            return NextResponse.json({ error: `Falta archivo: ${field.label}` }, { status: 400 });
          }
        } else if (val != null) {
          const s = String(val).trim();
          if (field.required && !s) {
            return NextResponse.json({ error: `Campo requerido: ${field.label}` }, { status: 400 });
          }
          if (s) datos[field.key] = s;
        } else if (field.required) {
          return NextResponse.json({ error: `Campo requerido: ${field.label}` }, { status: 400 });
        }
      }
    }

    const scoring = computeCandidateScore(datos, telemetry);

    const prefix = slug.slice(0, 3).toUpperCase();
    const id = makeId(prefix);

    await prisma.submission.create({
      data: {
        id,
        tenantId: tenant.id,
        data: { ...datos, _scoring: scoring } as unknown as Prisma.InputJsonValue,
        files: archivos,
        status: "nuevo",
      },
    });

    // Enviar notificación por WhatsApp al admin si está configurado
    if (settings.notifyOnSubmission && settings.adminNotifyPhone) {
      const candidateName = [datos.nombre, datos.apellido].filter(Boolean).join(" ") || "Postulante";
      const area = datos.area_aplicar || datos.oficio_profesion || "General";
      const phone = datos.celular || "Sin teléfono";
      const msg = `🔔 *Nueva solicitud de empleo recibida*\n\n🏢 *Empresa:* ${tenant.name}\n👤 *Candidato:* ${candidateName}\n💼 *Área/Puesto:* ${area}\n📱 *Teléfono:* ${phone}\n\nIngresa al panel de TalentoLink para ver el perfil completo y su CV.`;

      sendWhatsAppMessage(settings.adminNotifyPhone, msg, settings.whatsappInstance).catch((err) => {
        console.error("Error enviando alerta whatsapp al admin:", err);
      });
    }

    return NextResponse.json({ ok: true, id, score: scoring.overall });
  } catch (e) {
    console.error("submission create error", e);
    return NextResponse.json({ error: "Error al guardar solicitud" }, { status: 500 });
  }
}
