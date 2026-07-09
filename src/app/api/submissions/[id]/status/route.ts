import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { STATUS_LABELS, asSubmissionData, getCandidateName } from "@/lib/candidate";
import { assertSubmissionAccess } from "@/lib/session";
import {
  acceptanceMessage,
} from "@/lib/notifications/messages";
import { notifyCandidateWhatsApp } from "@/lib/notifications/whatsapp";

const ALLOWED_STATUSES = Object.keys(STATUS_LABELS);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const access = await assertSubmissionAccess(id);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const body = await req.json();
  const { status, notifyWhatsApp } = body as { status?: string; notifyWhatsApp?: boolean };

  if (!status || !ALLOWED_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }

  const submission = await prisma.submission.findUnique({
    where: { id },
    include: { tenant: true },
  });
  if (!submission) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const updated = await prisma.submission.update({
    where: { id },
    data: { status },
  });

  let notification: Awaited<ReturnType<typeof notifyCandidateWhatsApp>> | null = null;

  if (notifyWhatsApp && status === "aceptado") {
    const data = asSubmissionData(submission.data);
    const phone = String(data.celular ?? "");
    const message = acceptanceMessage({
      candidateName: getCandidateName(data),
      tenantName: submission.tenant.name,
    });
    notification = await notifyCandidateWhatsApp({
      submissionId: id,
      phone,
      type: "aceptacion",
      body: message,
    });
  }

  return NextResponse.json({
    id: updated.id,
    status: updated.status,
    notification: notification
      ? {
          sent: notification.sent,
          manualUrl: notification.manualUrl,
          error: notification.error,
        }
      : undefined,
  });
}
