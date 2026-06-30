import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Download,
  FileText,
  Globe,
  Mail,
  MapPin,
  Phone,
  DollarSign,
  Calendar,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { suggestPositions } from "@/lib/ai";
import {
  asSubmissionData,
  asSubmissionFiles,
  getCandidateHeadline,
  getCandidateName,
  getCandidateLocation,
  formatSalary,
  groupFields,
  STATUS_COLORS,
  STATUS_LABELS,
} from "@/lib/candidate";
import { computeCandidateScore, parseScoring, getScoreColor } from "@/lib/scoring";
import { uploadUrl } from "@/lib/files";
import { StatusUpdater } from "@/components/admin/StatusUpdater";
import { AiInsightPanel } from "@/components/admin/AiInsightPanel";
import { CandidateAvatar } from "@/components/admin/CandidateAvatar";
import { ScorePanel } from "@/components/admin/ScorePanel";
import {
  CandidateFieldGroups,
  CandidateSkillsBlock,
} from "@/components/admin/CandidateProfileSections";
import { getCvFilename, getPhotoFilename, isPdfFilename } from "@/lib/candidate";
import { getTenantSession } from "@/lib/tenant-auth";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CandidatoDetailPage({ params }: Props) {
  const { id } = await params;
  const tenantSession = await getTenantSession();

  const submission = await prisma.submission.findUnique({
    where: { id },
    include: { tenant: true },
  });
  if (!submission) notFound();

  if (tenantSession && submission.tenant.slug !== tenantSession) {
    notFound();
  }

  const data = asSubmissionData(submission.data);
  const files = asSubmissionFiles(submission.files);
  const name = getCandidateName(data);
  const headline = getCandidateHeadline(data);
  const fieldGroups = groupFields(data);
  const slug = submission.tenant.slug;
  const positions = suggestPositions(data);
  const cv = getCvFilename(files);
  const photo = getPhotoFilename(files);
  const location = getCandidateLocation(data);
  const scoring = parseScoring(data) ?? computeCandidateScore(data);
  const scoreColor = getScoreColor(scoring.grade);
  const isSuperAdmin = !tenantSession;

  return (
    <div className="max-w-lg mx-auto pb-8 sm:max-w-2xl lg:max-w-3xl">
      <Link
        href="/admin/candidatos"
        className="inline-flex items-center gap-2 mb-4 text-sm text-slate-400 hover:text-teal-300"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver
      </Link>

      {/* Hero móvil */}
      <div className="overflow-hidden tl-card mb-4">
        <div
          className="h-20 sm:h-24"
          style={{
            background: `linear-gradient(135deg, ${submission.tenant.primaryColor}99, ${submission.tenant.accentColor}55)`,
          }}
        />
        <div className="px-4 pb-4 -mt-10 sm:px-5">
          <div className="flex items-end gap-3">
            <CandidateAvatar
              data={data}
              files={files}
              tenantSlug={slug}
              size="lg"
              className="border-4 border-[var(--tl-bg)] shadow-lg shrink-0"
            />
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h1 className="text-xl font-bold text-white truncate sm:text-2xl">{name}</h1>
                  <p className="text-sm text-slate-400 truncate">{headline}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-bold rounded-lg border shrink-0 ${scoreColor}`}>
                  {scoring.overall}
                </span>
              </div>
            </div>
          </div>

          {location && (
            <p className="flex items-center gap-1.5 mt-3 text-xs text-slate-400">
              <MapPin className="w-3.5 h-3.5 shrink-0 text-teal-400" />
              <span className="line-clamp-2">{location}</span>
            </p>
          )}

          {isSuperAdmin && (
            <p className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
              <Building2 className="w-3.5 h-3.5" />
              {submission.tenant.name}
            </p>
          )}

          {/* Acciones rápidas móvil */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            {data.celular && (
              <a
                href={`tel:${data.celular}`}
                className="flex flex-col items-center gap-1 p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-300 active:scale-95 transition-transform"
              >
                <Phone className="w-5 h-5" />
                <span className="text-[10px] font-semibold">Llamar</span>
              </a>
            )}
            {data.correo && (
              <a
                href={`mailto:${data.correo}`}
                className="flex flex-col items-center gap-1 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 active:scale-95 transition-transform"
              >
                <Mail className="w-5 h-5" />
                <span className="text-[10px] font-semibold">Correo</span>
              </a>
            )}
            {(data.red_profesional || data.linkedin_url) && (
              <a
                href={String(data.red_profesional ?? data.linkedin_url)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1 p-3 rounded-xl bg-white/[0.04] border border-white/10 text-slate-300 active:scale-95 transition-transform"
              >
                <Globe className="w-5 h-5" />
                <span className="text-[10px] font-semibold">Web</span>
              </a>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-4">
            <span
              className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg border ${STATUS_COLORS[submission.status] ?? STATUS_COLORS.nuevo}`}
            >
              {STATUS_LABELS[submission.status] ?? submission.status}
            </span>
            {data.sueldo_aspirado && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20">
                <DollarSign className="w-3.5 h-3.5" />
                {formatSalary(data.sueldo_aspirado)}
              </span>
            )}
            <StatusUpdater submissionId={submission.id} currentStatus={submission.status} />
          </div>
        </div>
      </div>

      {/* Puestos sugeridos */}
      {positions.length > 0 && (
        <section className="p-4 mb-4 tl-card">
          <p className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-teal-400">
            <Briefcase className="w-4 h-4" />
            Encaja en
          </p>
          <div className="flex flex-wrap gap-2">
            {positions.map((p) => (
              <span
                key={p}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl bg-teal-500/10 text-teal-200 border border-teal-500/20"
              >
                <Briefcase className="w-3.5 h-3.5 opacity-70" />
                {p}
              </span>
            ))}
          </div>
        </section>
      )}

      <div className="space-y-4">
        <CandidateSkillsBlock data={data} />
        <ScorePanel scoring={scoring} />
        <AiInsightPanel submissionId={submission.id} />
        <CandidateFieldGroups groups={fieldGroups} />

        {Object.keys(files).length > 0 && (
          <section className="p-4 sm:p-5 tl-card">
            <h2 className="flex items-center gap-2 mb-4 text-xs font-bold tracking-wider uppercase text-teal-400">
              <FileText className="w-4 h-4" />
              Documentos
            </h2>
            <div className="grid gap-3 grid-cols-2">
              {photo && (
                <a
                  href={uploadUrl(photo, slug)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block overflow-hidden rounded-xl border border-white/10"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={uploadUrl(photo, slug)} alt="Foto" className="object-cover w-full aspect-square" />
                  <p className="p-2 text-[10px] text-center text-slate-500">Foto</p>
                </a>
              )}
              {cv && (
                <a
                  href={uploadUrl(cv, slug)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center p-4 rounded-xl border border-white/10 bg-white/[0.03] aspect-square"
                >
                  <FileText className={`w-10 h-10 mb-2 ${isPdfFilename(cv) ? "text-red-400" : "text-slate-400"}`} />
                  <p className="text-xs font-medium text-white">CV</p>
                  <Download className="w-4 h-4 mt-2 text-teal-400" />
                </a>
              )}
            </div>
          </section>
        )}

        <div className="flex items-center gap-2 p-4 text-xs text-slate-600 tl-card">
          <Calendar className="w-3.5 h-3.5 shrink-0" />
          <span>Registrado {submission.createdAt.toLocaleString("es-DO")}</span>
        </div>
      </div>
    </div>
  );
}
