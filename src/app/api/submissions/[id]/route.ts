import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { asSubmissionData, getCandidateName } from "@/lib/candidate";
import { assertSubmissionAccess } from "@/lib/session";
import { deleteSubmission } from "@/lib/submissions";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const access = await assertSubmissionAccess(id);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const body = await req.json().catch(() => ({}));
  if (body.confirm !== true) {
    return NextResponse.json({ error: 'Confirma con { "confirm": true }' }, { status: 400 });
  }

  const result = await deleteSubmission(id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const access = await assertSubmissionAccess(id);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const submission = await prisma.submission.findUnique({
    where: { id },
    include: {
      booking: { include: { slot: true } },
      notifications: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  if (!submission) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    id: submission.id,
    status: submission.status,
    booking: submission.booking
      ? {
          slotId: submission.booking.slotId,
          startsAt: submission.booking.slot.startsAt,
          endsAt: submission.booking.slot.endsAt,
          location: submission.booking.slot.location,
        }
      : null,
    notifications: submission.notifications,
    candidateName: getCandidateName(asSubmissionData(submission.data)),
    phone: String(asSubmissionData(submission.data).celular ?? ""),
  });
}
