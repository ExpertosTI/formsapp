"use client";

import { FileText, ImageIcon } from "lucide-react";
import { getCvFilename, getPhotoFilename, isImageFilename, isPdfFilename } from "@/lib/candidate";
import type { SubmissionFiles } from "@/lib/candidate";
import { uploadUrl } from "@/lib/files";

interface Props {
  files: SubmissionFiles;
  tenantSlug: string;
}

export function FileThumbnails({ files, tenantSlug }: Props) {
  const cv = getCvFilename(files);
  const photo = getPhotoFilename(files);
  if (!cv && !photo) return null;

  function openFile(e: React.MouseEvent, filename: string) {
    e.preventDefault();
    e.stopPropagation();
    window.open(uploadUrl(filename, tenantSlug), "_blank", "noopener,noreferrer");
  }

  return (
    <div className="flex gap-2 mt-3">
      {photo && (
        <button
          type="button"
          onClick={(e) => openFile(e, photo)}
          className="block w-12 h-12 overflow-hidden rounded-lg border border-white/10 hover:border-teal-400/40 transition-colors"
          title="Foto"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={uploadUrl(photo, tenantSlug)} alt="Foto" className="object-cover w-full h-full" />
        </button>
      )}
      {cv && (
        <button
          type="button"
          onClick={(e) => openFile(e, cv)}
          className="flex flex-col items-center justify-center w-12 h-12 rounded-lg border border-white/10 bg-white/[0.04] hover:border-teal-400/40 transition-colors"
          title="Curriculum"
        >
          {isImageFilename(cv) ? (
            <ImageIcon className="w-5 h-5 text-slate-400" />
          ) : (
            <FileText className={`w-5 h-5 ${isPdfFilename(cv) ? "text-red-400" : "text-slate-400"}`} />
          )}
          <span className="text-[8px] text-slate-500 mt-0.5">CV</span>
        </button>
      )}
    </div>
  );
}
