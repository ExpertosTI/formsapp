import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { asSubmissionFiles, DELETABLE_STATUSES } from "@/lib/candidate";

const UPLOADS = path.join(process.cwd(), "public", "uploads");

export function deleteSubmissionFiles(files: unknown) {
  const map = asSubmissionFiles(files);
  for (const filename of Object.values(map)) {
    if (!filename || filename.startsWith("http")) continue;
    const dest = path.join(UPLOADS, path.basename(filename));
    try {
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
    } catch {
      // ignore missing files
    }
  }
}

export async function deleteSubmission(submissionId: string) {
  const sub = await prisma.submission.findUnique({ where: { id: submissionId } });
  if (!sub) return { ok: false as const, error: "No encontrado", status: 404 };

  if (!DELETABLE_STATUSES.includes(sub.status as (typeof DELETABLE_STATUSES)[number])) {
    return {
      ok: false as const,
      error: "Solo puedes eliminar candidatos aceptados, en entrevista, contratados o archivados",
      status: 400,
    };
  }

  deleteSubmissionFiles(sub.files);
  await prisma.submission.delete({ where: { id: submissionId } });
  return { ok: true as const };
}
