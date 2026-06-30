import Link from "next/link";
import { MapPin, ChevronRight } from "lucide-react";
import {
  asSubmissionData,
  asSubmissionFiles,
  formatSalary,
  getCandidateHeadline,
  getCandidateLocation,
  getCandidateName,
  parseSalary,
  STATUS_COLORS,
  STATUS_LABELS,
} from "@/lib/candidate";
import { computeCandidateScore, parseScoring, getScoreColor } from "@/lib/scoring";
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
  showTenant?: boolean;
}

export function CandidateCard({
  id,
  data,
  files,
  status,
  createdAt,
  tenantName,
  tenantSlug,
  showTenant = true,
}: Props) {
  const fields = asSubmissionData(data);
  const fileMap = asSubmissionFiles(files);
  const name = getCandidateName(fields);
  const headline = getCandidateHeadline(fields);
  const location = getCandidateLocation(fields);
  const salary = parseSalary(fields.sueldo_aspirado);
  const scoring = parseScoring(fields) ?? computeCandidateScore(fields);
  const scoreColor = getScoreColor(scoring.grade);

  return (
    <Link
      href={`/admin/candidatos/${id}`}
      className="block tl-card-hover overflow-hidden group"
    >
      <div className="flex gap-0 sm:gap-0">
        <div
          className="w-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity"
          style={{ background: `linear-gradient(180deg, var(--tl-accent), var(--tl-accent-2))` }}
        />
        <div className="flex flex-1 gap-3 p-4 sm:p-4 min-w-0">
          <CandidateAvatar
            data={fields}
            files={fileMap}
            tenantSlug={tenantSlug}
            size="md"
            className="shrink-0 ring-2 ring-white/10 group-hover:ring-teal-400/30 transition-all"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-[15px] font-semibold text-white truncate group-hover:text-teal-300 transition-colors">
                  {name}
                </h3>
                <p className="text-xs text-slate-400 truncate">{headline}</p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${scoreColor}`}>
                  {scoring.overall}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-teal-400 transition-colors" />
              </div>
            </div>

            {location && (
              <p className="flex items-center gap-1 mt-1.5 text-[11px] text-slate-500 truncate">
                <MapPin className="w-3 h-3 shrink-0" />
                {location}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase rounded border ${STATUS_COLORS[status] ?? STATUS_COLORS.nuevo}`}>
                {STATUS_LABELS[status] ?? status}
              </span>
              {showTenant && (
                <span className="text-[10px] text-slate-500 truncate max-w-[8rem]">{tenantName}</span>
              )}
              {salary != null && (
                <span className="text-[10px] font-medium text-amber-300/90">{formatSalary(fields.sueldo_aspirado)}</span>
              )}
            </div>

            <div className="flex items-center justify-between mt-2">
              <FileThumbnails files={fileMap} tenantSlug={tenantSlug} />
              <span className="text-[10px] text-slate-600">
                {createdAt.toLocaleDateString("es-DO", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
