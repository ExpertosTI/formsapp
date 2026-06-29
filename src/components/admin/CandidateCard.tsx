import Link from "next/link";
import { Building2, ChevronRight } from "lucide-react";
import {
  asSubmissionData,
  asSubmissionFiles,
  formatSalary,
  getCandidateHeadline,
  getCandidateName,
  parseSalary,
  STATUS_COLORS,
  STATUS_LABELS,
} from "@/lib/candidate";
import { CandidateAvatar } from "@/components/admin/CandidateAvatar";
import { FileThumbnails } from "@/components/admin/FileThumbnails";

interface Props {
  id: string;
  data: unknown;
  files: unknown;
  status: string;
  createdAt: Date;
  tenantName: string;
  tenantSlug: string;
}

export function CandidateCard({
  id,
  data,
  files,
  status,
  createdAt,
  tenantName,
  tenantSlug,
}: Props) {
  const fields = asSubmissionData(data);
  const fileMap = asSubmissionFiles(files);
  const name = getCandidateName(fields);
  const headline = getCandidateHeadline(fields);
  const salary = parseSalary(fields.sueldo_aspirado);

  return (
    <Link href={`/admin/candidatos/${id}`} className="block p-4 sm:p-5 tl-card-hover group">
      <div className="flex gap-3 sm:gap-4">
        <CandidateAvatar data={fields} files={fileMap} tenantSlug={tenantSlug} size="md" className="transition-transform duration-300 group-hover:scale-105" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 sm:gap-3">
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-white truncate group-hover:text-teal-300 transition-colors duration-300">
                {name}
              </h3>
              <p className="text-sm text-slate-400 truncate">{headline}</p>
            </div>
            <ChevronRight className="flex-shrink-0 w-5 h-5 mt-1 text-slate-600 transition-all duration-300 group-hover:text-teal-400 group-hover:translate-x-0.5" />
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${STATUS_COLORS[status] ?? STATUS_COLORS.nuevo}`}>
              {STATUS_LABELS[status] ?? status}
            </span>
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Building2 className="w-3 h-3" />
              {tenantName}
            </span>
            {salary != null && (
              <span className="text-xs font-medium text-amber-300/90">{formatSalary(fields.sueldo_aspirado)}</span>
            )}
          </div>
          <FileThumbnails files={fileMap} tenantSlug={tenantSlug} />
          <p className="mt-2 text-[10px] text-slate-600">
            {createdAt.toLocaleDateString("es-DO", { dateStyle: "medium" })}
          </p>
        </div>
      </div>
    </Link>
  );
}
