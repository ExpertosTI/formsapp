import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { asSubmissionData } from "@/lib/candidate";
import { getCandidateInsight, suggestPositions } from "@/lib/ai";
import { assertSubmissionAccess } from "@/lib/session";

export async function POST(req: NextRequest) {
  const { submissionId } = await req.json();
  if (!submissionId) {
    return NextResponse.json({ error: "submissionId required" }, { status: 400 });
  }

  const access = await assertSubmissionAccess(submissionId);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const sub = await prisma.submission.findUnique({ where: { id: submissionId } });
  if (!sub) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data = asSubmissionData(sub.data);
  const insight = await getCandidateInsight(data);
  const suggestedPositions = suggestPositions(data);
  return NextResponse.json({ ...insight, suggestedPositions });
}
