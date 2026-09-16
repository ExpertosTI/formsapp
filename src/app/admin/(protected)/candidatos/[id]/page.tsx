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
  Eye,
  Sparkles,
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
import { FavoriteButton } from "@/components/admin/FavoriteButton";
import {
  CandidateFieldGroups,
  CandidateSkillsBlock,
} from "@/components/admin/CandidateProfileSections";
import { getCvFilename, getPhotoFilename, isPdfFilename } from "@/lib/candidate";
import { getTenantSession } from "@/lib/tenant-auth";
import { CandidateWorkflowPanel } from "@/components/admin/CandidateWorkflowPanel";
import { NativeDocActions } from "@/components/native/NativeDocActions";

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

  let booking: {
    slot: { startsAt: Date; location: string };
  } | null = null;
  let slotsForPanel: {
    id: string;
    startsAt: string;
    endsAt: string;
    location: string;
    quota: number;
    booked: number;
    remaining: number;
    notes?: string | null;
  }[] = [];

  try {
    const [bookingRow, interviewSlots] = await Promise.all([
      prisma.interviewBooking.findUnique({
        where: { submissionId: id },
        include: { slot: true },
      }),
      prisma.interviewSlot.findMany({
        where: {
          tenantId: submission.tenantId,
          startsAt: { gte: new Date() },
        },
        orderBy: { startsAt: "asc" },
        include: { _count: { select: { bookings: true } } },
        take: 30,
      }),
    ]);
    booking = bookingRow;
    slotsForPanel = interviewSlots.map((s) => ({
      id: s.id,
      startsAt: s.startsAt.toISOString(),
      endsAt: s.endsAt.toISOString(),
      location: s.location,
      quota: s.quota,
      booked: s._count.bookings,
      remaining: Math.max(0, s.quota - s._count.bookings),
      notes: s.notes,
    }));
  } catch (e) {
    console.error("interview tables unavailable; perfil se muestra sin agenda", e);
  }

  const cvUrl = cv ? uploadUrl(cv, slug) : null;
  const photoUrl = photo ? uploadUrl(photo, slug) : null;

  return (
    <div className="w-full max-w-[1600px] mx-auto pb-12">
      {/* Barra superior de navegación */}
      <div className="flex items-center justify-between gap-4 mb-5">
        <Link
          href={tenantSession ? `/admin/candidatos?empresa=${tenantSession}` : "/admin/candidatos"}
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-teal-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al listado de candidatos</span>
        </Link>

        <div className="flex items-center gap-2">
          {cvUrl && (
            <NativeDocActions
              url={cvUrl}
              filename={cv ?? undefined}
              title={`CV de ${name}`}
              compact
            />
          )}
          <FavoriteButton submissionId={submission.id} isFavorite={submission.status === "favorito"} />
        </div>
      </div>

      {/* BANNER PRINCIPAL DE ESCRITORIO Y MÓVIL */}
      <div className="overflow-hidden tl-card mb-6 border-white/10 shadow-2xl">
        <div
          className="h-24 sm:h-28 lg:h-32 relative"
          style={{
            background: `linear-gradient(135deg, ${submission.tenant.primaryColor}cc, ${submission.tenant.accentColor}44, #070b14)`,
          }}
        >
          <div className="absolute top-4 right-4 flex items-center gap-2">
            {isSuperAdmin && (
              <span className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-black/40 backdrop-blur-md text-slate-200 border border-white/10">
                <Building2 className="w-3.5 h-3.5 text-teal-400" />
                {submission.tenant.name}
              </span>
            )}
          </div>
        </div>

        <div className="px-5 pb-5 -mt-12 sm:-mt-14 sm:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <CandidateAvatar
                data={data}
                files={files}
                tenantSlug={slug}
                size="lg"
                className="w-20 h-20 sm:w-24 sm:h-24 border-4 border-[#090f1d] shadow-2xl shrink-0"
              />
              <div className="min-w-0 pb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight truncate">
                    {name}
                  </h1>
                  <span className={`px-2.5 py-0.5 text-xs font-bold rounded-lg border shrink-0 ${scoreColor}`}>
                    Score: {scoring.overall}/100 ({scoring.grade})
                  </span>
                </div>
                <p className="text-sm sm:text-base text-slate-300 font-medium truncate mt-0.5">
                  {headline}
                </p>
                {location && (
                  <p className="flex items-center gap-1.5 mt-1 text-xs text-slate-400 truncate">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-teal-400" />
                    <span>{location}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Selector de Estado y Sueldo */}
            <div className="flex items-center gap-2.5 flex-wrap pt-2 md:pt-0">
              {data.sueldo_aspirado && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/25">
                  <DollarSign className="w-3.5 h-3.5" />
                  {formatSalary(data.sueldo_aspirado)}
                </span>
              )}
              <span
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-xl border ${
                  STATUS_COLORS[submission.status] ?? STATUS_COLORS.nuevo
                }`}
              >
                {STATUS_LABELS[submission.status] ?? submission.status}
              </span>
              <StatusUpdater submissionId={submission.id} currentStatus={submission.status} />
            </div>
          </div>
        </div>
      </div>

      {/* GRID DE 2 COLUMNAS EN ESCRITORIO (35% Izquierda - 65% Derecha) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLUMNA IZQUIERDA: Contacto, Scoring, WhatsApp, Citas */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          {/* Tarjeta de Contacto Directo */}
          <section className="p-5 tl-card space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Contacto y Enlaces
            </h2>

            <div className="space-y-2.5 text-xs">
              {data.celular && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="flex items-center gap-2 min-w-0">
                    <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-white font-mono">{String(data.celular)}</span>
                  </div>
                  <a
                    href={`tel:${data.celular}`}
                    className="tl-link text-emerald-400 hover:text-emerald-300"
                  >
                    Llamar
                  </a>
                </div>
              )}

              {data.correo && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="flex items-center gap-2 min-w-0">
                    <Mail className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span className="text-white truncate">{String(data.correo)}</span>
                  </div>
                  <a
                    href={`mailto:${data.correo}`}
                    className="tl-link text-indigo-400 hover:text-indigo-300"
                  >
                    Escribir
                  </a>
                </div>
              )}

              {(data.red_profesional || data.linkedin_url) && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="flex items-center gap-2 min-w-0">
                    <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span className="text-white truncate">Red Profesional</span>
                  </div>
                  <a
                    href={String(data.red_profesional ?? data.linkedin_url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tl-link text-cyan-400 hover:text-cyan-300"
                  >
                    Abrir perfil →
                  </a>
                </div>
              )}
            </div>
          </section>

          {/* Workflow Panel (Mensajería WhatsApp, Agenda de Citas) */}
          <CandidateWorkflowPanel
            submissionId={submission.id}
            currentStatus={submission.status}
            tenantSlug={slug}
            candidateName={name}
            slots={slotsForPanel}
          />

          {/* Entrevista Agendada (si existe) */}
          {booking && (
            <section className="p-4 tl-card border-purple-500/30 bg-purple-500/[0.05]">
              <p className="text-xs font-bold uppercase tracking-wider text-purple-300 mb-1 flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                Entrevista agendada
              </p>
              <p className="text-sm font-semibold text-white">
                {booking.slot.startsAt.toLocaleString("es-DO", {
                  dateStyle: "full",
                  timeStyle: "short",
                })}
              </p>
              <p className="text-xs text-slate-400 mt-1">Lugar: {booking.slot.location}</p>
            </section>
          )}

          {/* Panel de Scoring IA y Radar */}
          <ScorePanel scoring={scoring} />

          {/* Insights de IA */}
          <AiInsightPanel submissionId={submission.id} />

          {/* Puestos Sugeridos */}
          {positions.length > 0 && (
            <section className="p-5 tl-card space-y-3">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-400">
                <Briefcase className="w-4 h-4" />
                Vacantes sugeridas por el perfil
              </p>
              <div className="flex flex-wrap gap-2">
                {positions.map((p) => (
                  <span
                    key={p}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-teal-500/10 text-teal-200 border border-teal-500/20"
                  >
                    <Briefcase className="w-3.5 h-3.5 opacity-70" />
                    {p}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Registro del Candidato */}
          <div className="flex items-center gap-2 p-4 text-xs text-slate-500 tl-card">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span>Postulado el {submission.createdAt.toLocaleString("es-DO")}</span>
          </div>
        </div>

        {/* COLUMNA DERECHA: Experiencia, Educación, Formulario Completo y Visor de CV */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {/* VISOR DE CV EN PANTALLAS DE ESCRITORIO */}
          {cvUrl && (
            <section className="p-5 tl-card space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-bold text-white">
                  <FileText className="w-4 h-4 text-teal-400" />
                  Currículum Vitae (CV) Adjunto
                </h2>
                <NativeDocActions url={cvUrl} filename={cv ?? undefined} title={`CV de ${name}`} />
              </div>

              {isPdfFilename(cv!) ? (
                <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-slate-950/80 shadow-inner">
                  <iframe
                    src={cvUrl}
                    className="w-full h-[620px] rounded-xl"
                    title={`CV de ${name}`}
                  />
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-center">
                  <p className="text-xs text-slate-400 mb-3">
                    El documento fue subido como imagen o formato descargable.
                  </p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cvUrl}
                    alt={`CV de ${name}`}
                    className="max-h-[500px] mx-auto rounded-xl object-contain border border-white/10"
                  />
                </div>
              )}
            </section>
          )}

          {/* Bloque de Habilidades */}
          <CandidateSkillsBlock data={data} />

          {/* Secciones de Información del Formulario */}
          <CandidateFieldGroups groups={fieldGroups} />

          {/* Galería de Documentos Adicionales */}
          {Object.keys(files).length > 0 && (
            <section className="p-5 tl-card space-y-4">
              <h2 className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-teal-400">
                <Eye className="w-4 h-4" />
                Archivos y Evidencias
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {photoUrl && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-300">Foto del Postulante</p>
                    <a
                      href={photoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block overflow-hidden rounded-2xl border border-white/10 hover:border-teal-400/50 transition-colors group"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photoUrl}
                        alt={`Foto de ${name}`}
                        className="object-cover w-full aspect-square group-hover:scale-105 transition-transform duration-300"
                      />
                    </a>
                  </div>
                )}

                {cvUrl && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-300">Documento CV</p>
                    <a
                      href={cvUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center justify-center p-6 rounded-2xl border border-white/10 bg-white/[0.03] aspect-square hover:border-teal-400/50 transition-colors group"
                    >
                      <FileText className={`w-12 h-12 mb-3 ${isPdfFilename(cv!) ? "text-red-400" : "text-slate-400"}`} />
                      <p className="text-xs font-semibold text-white">Ver Documento</p>
                      <Download className="w-4 h-4 mt-2 text-teal-400 group-hover:translate-y-0.5 transition-transform" />
                    </a>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
