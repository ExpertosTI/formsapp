import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { STATUS_LABELS } from "@/lib/candidate";
import { assertSubmissionAccess } from "@/lib/session";

const ALLOWED_STATUSES = Object.keys(STATUS_LABELS);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const access = await assertSubmissionAccess(id);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const { status } = await req.json();
  if (!ALLOWED_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }

  const updated = await prisma.submission.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json({ id: updated.id, status: updated.status });
}
