import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionContext } from "@/lib/session";

async function resolveTenantId(req: NextRequest): Promise<
  | { ok: true; tenantId: string | null; isSuperAdmin: boolean }
  | { ok: false; status: number; error: string }
> {
  const { isSuperAdmin, tenantSlug } = await getSessionContext();
  if (!isSuperAdmin && !tenantSlug) {
    return { ok: false, status: 401, error: "No autorizado" };
  }

  const empresa = req.nextUrl.searchParams.get("empresa");
  const slug = tenantSlug ?? empresa;
  if (!slug && !isSuperAdmin) {
    return { ok: false, status: 400, error: "Empresa requerida" };
  }

  if (!slug) {
    return { ok: true, tenantId: null, isSuperAdmin: true };
  }

  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) return { ok: false, status: 404, error: "Empresa no encontrada" };

  if (tenantSlug && tenant.slug !== tenantSlug) {
    return { ok: false, status: 403, error: "Sin permiso" };
  }

  return { ok: true, tenantId: tenant.id, isSuperAdmin };
}

export async function GET(req: NextRequest) {
  const access = await resolveTenantId(req);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const upcoming = req.nextUrl.searchParams.get("upcoming") !== "false";
  const where = {
    ...(access.tenantId ? { tenantId: access.tenantId } : {}),
    ...(upcoming ? { startsAt: { gte: new Date() } } : {}),
  };

  const slots = await prisma.interviewSlot.findMany({
    where,
    orderBy: { startsAt: "asc" },
    include: { _count: { select: { bookings: true } } },
    take: 50,
  });

  return NextResponse.json({
    slots: slots.map((s) => ({
      id: s.id,
      startsAt: s.startsAt,
      endsAt: s.endsAt,
      location: s.location,
      quota: s.quota,
      booked: s._count.bookings,
      remaining: Math.max(0, s.quota - s._count.bookings),
      notes: s.notes,
    })),
  });
}

export async function POST(req: NextRequest) {
  const access = await resolveTenantId(req);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const body = await req.json();
  const { startsAt, endsAt, location, quota, notes, empresa } = body as {
    startsAt?: string;
    endsAt?: string;
    location?: string;
    quota?: number;
    notes?: string;
    empresa?: string;
  };

  let tenantId = access.tenantId;
  if (!tenantId && empresa) {
    const tenant = await prisma.tenant.findUnique({ where: { slug: empresa } });
    if (!tenant) return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 });
    tenantId = tenant.id;
  }

  if (!tenantId) {
    return NextResponse.json({ error: "Empresa requerida" }, { status: 400 });
  }

  if (!startsAt || !endsAt || !location?.trim()) {
    return NextResponse.json({ error: "Fecha, hora y lugar son requeridos" }, { status: 400 });
  }

  const start = new Date(startsAt);
  const end = new Date(endsAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return NextResponse.json({ error: "Horario inválido" }, { status: 400 });
  }

  const slot = await prisma.interviewSlot.create({
    data: {
      tenantId,
      startsAt: start,
      endsAt: end,
      location: location.trim(),
      quota: Math.max(1, Math.min(100, Number(quota) || 5)),
      notes: notes?.trim() || null,
    },
  });

  return NextResponse.json({ slot });
}
