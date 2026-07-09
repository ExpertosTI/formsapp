import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionContext } from "@/lib/session";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { isSuperAdmin, tenantSlug } = await getSessionContext();
  if (!isSuperAdmin && !tenantSlug) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const slot = await prisma.interviewSlot.findUnique({
    where: { id },
    include: { tenant: { select: { slug: true } }, _count: { select: { bookings: true } } },
  });

  if (!slot) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  if (!isSuperAdmin && slot.tenant.slug !== tenantSlug) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }

  if (slot._count.bookings > 0) {
    return NextResponse.json({ error: "No puedes eliminar un cupo con candidatos asignados" }, { status: 400 });
  }

  await prisma.interviewSlot.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
