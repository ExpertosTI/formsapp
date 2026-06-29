import { asSubmissionData, asSubmissionFiles, getCandidateInitials, getPhotoFilename } from "@/lib/candidate";
import { uploadUrl } from "@/lib/files";

interface Props {
  data: unknown;
  files: unknown;
  tenantSlug: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = { sm: 48, md: 56, lg: 96 };

export function CandidateAvatar({ data, files, tenantSlug, size = "md", className = "" }: Props) {
  const fileMap = asSubmissionFiles(files);
  const photo = getPhotoFilename(fileMap);
  const px = SIZES[size];
  const initials = getCandidateInitials(asSubmissionData(data));

  if (photo) {
    return (
      <div
        className={`relative overflow-hidden rounded-2xl border border-white/10 shrink-0 ${className}`}
        style={{ width: px, height: px }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={uploadUrl(photo, tenantSlug)}
          alt=""
          className="object-cover w-full h-full"
          width={px}
          height={px}
        />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center font-bold text-white rounded-2xl border border-white/10 bg-gradient-to-br from-teal-500/30 to-indigo-500/30 shrink-0 ${className}`}
      style={{ width: px, height: px, fontSize: px * 0.32 }}
    >
      {initials}
    </div>
  );
}
