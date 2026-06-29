import Link from "next/link";
import { Building2, MapPin, Mail, Phone, ChevronRight } from "lucide-react";
import {
  asSubmissionData,
  getCandidateHeadline,
  getCandidateInitials,
  getCandidateName,
  STATUS_COLORS,
  STATUS_LABELS,
} from "@/lib/candidate";

interface Props {
  id: string;
  data: unknown;
  status: string;
  createdAt: Date;
  tenantName: string;
  tenantSlug: string;
}

export function CandidateCard({
  id,
  data,
  status,
  createdAt,
  tenantName,
  tenantSlug,
}: Props) {
  const fields = asSubmissionData(data);
  const name = getCandidateName(fields);
  const headline = getCandidateHeadline(fields);
  const initials = getCandidateInitials(fields);

  return (
    <Link
      href={`/admin/candidatos/${id}`}
      className="block p-5 transition-all glass-card hover:bg-white/10 hover:-translate-y-0.5 group"
    >
      <div className="flex gap-4">
        <div className="flex items-center justify-center flex-shrink-0 w-14 h-14 text-lg font-bold rounded-full bg-gradient-to-br from-indigo-600/40 to-emerald-500/40 text-white border border-white/10">
          {initials}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                {name}
              </h3>
              <p className="text-sm text-slate-400 truncate">{headline}</p>
            </div>
            <ChevronRight className="flex-shrink-0 w-5 h-5 mt-1 text-slate-600 group-hover:text-emerald-400 transition-colors" />
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span
              className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${STATUS_COLORS[status] ?? STATUS_COLORS.nuevo}`}
            >
              {STATUS_LABELS[status] ?? status}
            </span>
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Building2 className="w-3 h-3" />
              {tenantName}
            </span>
          </div>

          <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-500">
            {fields.correo && (
              <span className="flex items-center gap-1">
                <Mail className="w-3 h-3" />
                {String(fields.correo)}
              </span>
            )}
            {fields.celular && (
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {String(fields.celular)}
              </span>
            )}
            {fields.direccion && (
              <span className="flex items-center gap-1 truncate max-w-xs">
                <MapPin className="w-3 h-3" />
                {String(fields.direccion)}
              </span>
            )}
          </div>

          <p className="mt-2 text-[10px] uppercase tracking-wider text-slate-600">
            {tenantSlug} · {createdAt.toLocaleDateString("es-DO", { dateStyle: "medium" })}
          </p>
        </div>
      </div>
    </Link>
  );
}
