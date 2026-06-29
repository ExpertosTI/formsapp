import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { asSubmissionData } from "@/lib/candidate";
import { getCandidateInsight } from "@/lib/ai";

export async function POST(req: NextRequest) {
  const { submissionId } = await req.json();
  if (!submissionId) {
    return NextResponse.json({ error: "submissionId required" }, { status: 400 });
  }

  const sub = await prisma.submission.findUnique({ where: { id: submissionId } });
  if (!sub) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const insight = await getCandidateInsight(asSubmissionData(sub.data));
  return NextResponse.json(insight);
}
