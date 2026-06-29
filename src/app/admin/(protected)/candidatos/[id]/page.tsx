import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Download,
  FileText,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  asSubmissionData,
  asSubmissionFiles,
  getCandidateHeadline,
  getCandidateInitials,
  getCandidateName,
  groupFields,
  STATUS_COLORS,
  STATUS_LABELS,
} from "@/lib/candidate";
import { StatusUpdater } from "@/components/admin/StatusUpdater";

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
  const initials = getCandidateInitials(data);
  const fieldGroups = groupFields(data);

  return (
    <div className="max-w-4xl">
      <Link
        href="/admin/candidatos"
        className="inline-flex items-center gap-2 mb-6 text-sm text-slate-400 hover:text-white"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a candidatos
      </Link>

      {/* Profile header — LinkedIn style */}
      <div className="overflow-hidden glass-card">
        <div className="h-24 bg-gradient-to-r from-indigo-900/60 to-emerald-900/40" />
        <div className="px-8 pb-8 -mt-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-5">
              <div className="flex items-center justify-center w-24 h-24 text-2xl font-black text-white border-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-emerald-500 border-[#0f172a]">
                {initials}
              </div>
              <div className="pb-1">
                <h1 className="text-2xl font-black text-white sm:text-3xl">{name}</h1>
                <p className="text-slate-400">{headline}</p>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-500">
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

          <div className="flex flex-wrap gap-4 mt-6">
            {data.correo && (
              <a
                href={`mailto:${data.correo}`}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-white/5 hover:bg-white/10"
              >
                <Mail className="w-4 h-4 text-emerald-400" />
                {String(data.correo)}
              </a>
            )}
            {data.celular && (
              <a
                href={`tel:${data.celular}`}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-white/5 hover:bg-white/10"
              >
                <Phone className="w-4 h-4 text-emerald-400" />
                {String(data.celular)}
              </a>
            )}
            <span
              className={`px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border ${STATUS_COLORS[submission.status] ?? STATUS_COLORS.nuevo}`}
            >
              {STATUS_LABELS[submission.status] ?? submission.status}
            </span>
          </div>
        </div>
      </div>

      {/* Field groups */}
      <div className="mt-6 space-y-4">
        {fieldGroups.map((group) => (
          <section key={group.title} className="p-6 glass-card">
            <h2 className="mb-4 text-sm font-bold tracking-wider uppercase text-emerald-400">
              {group.title}
            </h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              {group.fields.map((field) => (
                <div key={field.key}>
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {field.label}
                  </dt>
                  <dd className="mt-1 text-sm text-white whitespace-pre-wrap">{field.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>

      {/* Files */}
      {Object.keys(files).length > 0 && (
        <section className="p-6 mt-6 glass-card">
          <h2 className="flex items-center gap-2 mb-4 text-sm font-bold tracking-wider uppercase text-emerald-400">
            <FileText className="w-4 h-4" />
            Documentos adjuntos
          </h2>
          <div className="space-y-2">
            {Object.entries(files).map(([key, filename]) => (
              <a
                key={key}
                href={`/uploads/${filename}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 transition-colors rounded-xl bg-white/5 hover:bg-white/10"
              >
                <div>
                  <p className="text-sm font-medium text-white capitalize">{key}</p>
                  <p className="text-xs text-slate-500">{filename}</p>
                </div>
                <Download className="w-4 h-4 text-emerald-400" />
              </a>
            ))}
          </div>
        </section>
      )}

      <p className="mt-6 text-xs text-center text-slate-600">
        Registrado el {submission.createdAt.toLocaleString("es-DO")} · ID {submission.id}
      </p>
    </div>
  );
}
