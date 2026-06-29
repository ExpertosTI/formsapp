import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Download,
  FileText,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { suggestPositions } from "@/lib/ai";
import {
  asSubmissionData,
  asSubmissionFiles,
  getCandidateHeadline,
  getCandidateName,
  formatSalary,
  groupFields,
  STATUS_COLORS,
  STATUS_LABELS,
} from "@/lib/candidate";
import { uploadUrl } from "@/lib/files";
import { StatusUpdater } from "@/components/admin/StatusUpdater";
import { AiInsightPanel } from "@/components/admin/AiInsightPanel";
import { CandidateAvatar } from "@/components/admin/CandidateAvatar";
import { getCvFilename, getPhotoFilename, isPdfFilename } from "@/lib/candidate";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CandidatoDetailPage({ params }: Props) {
  const { id } = await params;
  const submission = await prisma.submission.findUnique({
    where: { id },
    include: { tenant: true },
  });
  if (!submission) notFound();

  const data = asSubmissionData(submission.data);
  const files = asSubmissionFiles(submission.files);
  const name = getCandidateName(data);
  const headline = getCandidateHeadline(data);
  const fieldGroups = groupFields(data);
  const slug = submission.tenant.slug;
  const positions = suggestPositions(data);
  const cv = getCvFilename(files);
  const photo = getPhotoFilename(files);

  return (
    <div className="max-w-5xl mx-auto">
      <Link
        href="/admin/candidatos"
        className="inline-flex items-center gap-2 mb-6 text-sm text-slate-400 hover:text-teal-300 transition-colors duration-300"
      >
        <ArrowLeft className="w-4 h-4" />
        Candidatos
      </Link>

      <div className="overflow-hidden tl-card">
        <div
          className="h-28"
          style={{
            background: `linear-gradient(135deg, ${submission.tenant.primaryColor}88, ${submission.tenant.accentColor}66)`,
          }}
        />
        <div className="px-6 pb-6 -mt-12 sm:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-end gap-4">
              <CandidateAvatar data={data} files={files} tenantSlug={slug} size="lg" className="border-4 border-[var(--tl-bg)] shadow-glow -mt-2" />
              <div className="pb-1">
                <h1 className="text-2xl font-bold text-white sm:text-3xl">{name}</h1>
                <p className="text-slate-400">{headline}</p>
                <div className="flex flex-wrap gap-3 mt-2 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-4 h-4" />
                    {submission.tenant.name}
                  </span>
                  {data.direccion && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {String(data.direccion)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <StatusUpdater submissionId={submission.id} currentStatus={submission.status} />
          </div>

          <div className="flex flex-wrap gap-3 mt-6">
            {data.correo && (
              <a href={`mailto:${data.correo}`} className="tl-btn-ghost text-xs">
                <Mail className="w-4 h-4 text-teal-400" />
                {String(data.correo)}
              </a>
            )}
            {data.celular && (
              <a href={`tel:${data.celular}`} className="tl-btn-ghost text-xs">
                <Phone className="w-4 h-4 text-teal-400" />
                {String(data.celular)}
              </a>
            )}
            <span
              className={`px-3 py-2 text-xs font-bold uppercase rounded-xl border ${STATUS_COLORS[submission.status] ?? STATUS_COLORS.nuevo}`}
            >
              {STATUS_LABELS[submission.status] ?? submission.status}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 mt-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {fieldGroups.map((group) => (
            <section key={group.title} className="p-6 tl-card">
              <h2 className="mb-4 text-xs font-bold tracking-wider uppercase text-teal-400">
                {group.title}
              </h2>
              <dl className="grid gap-4 sm:grid-cols-2">
                {group.fields.map((field) => (
                  <div key={field.key}>
                    <dt className="tl-label">{field.label}</dt>
                    <dd className="mt-1 text-sm text-white whitespace-pre-wrap">{field.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}

          {Object.keys(files).length > 0 && (
            <section className="p-6 tl-card">
              <h2 className="flex items-center gap-2 mb-4 text-xs font-bold tracking-wider uppercase text-teal-400">
                <FileText className="w-4 h-4" />
                Documentos
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {photo && (
                  <a href={uploadUrl(photo, slug)} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl border border-white/10 hover:border-teal-400/30 transition-colors">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={uploadUrl(photo, slug)} alt="Foto" className="object-cover w-full h-40" />
                    <p className="p-2 text-xs text-center text-slate-400">Foto de perfil</p>
                  </a>
                )}
                {cv && (
                  <a href={uploadUrl(cv, slug)} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center p-6 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] min-h-[10rem]">
                    <FileText className={`w-12 h-12 mb-2 ${isPdfFilename(cv) ? "text-red-400" : "text-slate-400"}`} />
                    <p className="text-sm font-medium text-white">Curriculum</p>
                    <p className="mt-1 text-xs text-slate-500 truncate max-w-full px-2">{cv}</p>
                    <Download className="w-4 h-4 mt-2 text-teal-400" />
                  </a>
                )}
              </div>
            </section>
          )}
        </div>

        <div className="space-y-4">
          <div className="tl-card p-4">
            <p className="flex items-center gap-1.5 mb-2 text-[11px] font-bold uppercase tracking-wider text-teal-400">
              <Briefcase className="w-3.5 h-3.5" />
              Puestos recomendados
            </p>
            <div className="flex flex-wrap gap-1.5">
              {positions.map((p) => (
                <span key={p} className="px-2 py-1 text-xs rounded-lg bg-teal-500/15 text-teal-200">{p}</span>
              ))}
            </div>
            {data.sueldo_aspirado && (
              <p className="mt-3 text-sm text-amber-300">{formatSalary(data.sueldo_aspirado)}</p>
            )}
          </div>
          <AiInsightPanel submissionId={submission.id} />
          <div className="tl-card p-4 text-xs text-slate-500">
            <p>Registrado {submission.createdAt.toLocaleString("es-DO")}</p>
            <p className="mt-1 font-mono opacity-60">{submission.id}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
