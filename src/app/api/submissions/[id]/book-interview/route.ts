import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { asSubmissionData, getCandidateName } from "@/lib/candidate";
import { assertSubmissionAccess } from "@/lib/session";
import { formatSlotDateTime, interviewInviteMessage } from "@/lib/notifications/messages";
import { notifyCandidateWhatsApp } from "@/lib/notifications/whatsapp";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const access = await assertSubmissionAccess(id);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const { slotId, notifyWhatsApp = true } = (await req.json()) as {
    slotId?: string;
    notifyWhatsApp?: boolean;
  };

  if (!slotId) {
    return NextResponse.json({ error: "Selecciona un cupo de entrevista" }, { status: 400 });
  }

  const submission = await prisma.submission.findUnique({
    where: { id },
    include: { tenant: true },
  });
  if (!submission) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const slot = await tx.interviewSlot.findUnique({
        where: { id: slotId },
        include: { _count: { select: { bookings: true } } },
      });

      if (!slot || slot.tenantId !== submission.tenantId) {
        throw new Error("Cupo no válido");
      }

      const existing = await tx.interviewBooking.findUnique({ where: { submissionId: id } });
      const occupied = slot._count.bookings - (existing?.slotId === slotId ? 1 : 0);
      if (occupied >= slot.quota) {
        throw new Error("Este cupo ya está lleno");
      }

      await tx.interviewBooking.upsert({
        where: { submissionId: id },
        create: { slotId, submissionId: id },
        update: { slotId },
      });

      await tx.submission.update({
        where: { id },
        data: { status: "entrevista" },
      });

      return slot;
    });

    let notification: Awaited<ReturnType<typeof notifyCandidateWhatsApp>> | null = null;

    if (notifyWhatsApp) {
      const data = asSubmissionData(submission.data);
      const { dateLabel, timeLabel } = formatSlotDateTime(result.startsAt, result.endsAt);
      const message = interviewInviteMessage({
        candidateName: getCandidateName(data),
        tenantName: submission.tenant.name,
        dateLabel,
        timeLabel,
        location: result.location,
        notes: result.notes,
      });

      notification = await notifyCandidateWhatsApp({
        submissionId: id,
        phone: String(data.celular ?? ""),
        type: "entrevista",
        body: message,
      });

      if (notification.sent || notification.manualUrl) {
        await prisma.interviewBooking.update({
          where: { submissionId: id },
          data: { notifiedAt: new Date() },
        });
      }
    }

    return NextResponse.json({
      ok: true,
      status: "entrevista",
      slot: {
        id: result.id,
        startsAt: result.startsAt,
        endsAt: result.endsAt,
        location: result.location,
      },
      notification: notification
        ? {
            sent: notification.sent,
            manualUrl: notification.manualUrl,
            error: notification.error,
          }
        : undefined,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "No se pudo reservar el cupo";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
