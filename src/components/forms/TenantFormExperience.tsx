"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Moon,
  Sun,
  Briefcase,
  DollarSign,
  MapPin,
  Clock,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import type { FormSection, JobPosition, ThemeMode, WorkType } from "@/lib/form-config";
import { TenantApplicationForm } from "./TenantApplicationForm";
import { TenantBrandLogo } from "./TenantBrandLogo";
import { TalentoLinkLogo } from "@/components/brand/TalentoLinkLogo";
import { useFormTheme, type FormColorMode } from "@/hooks/useFormTelemetry";

interface TenantTheme {
  primary: string;
  accent: string;
  bg: string;
}

interface Props {
  slug: string;
  tenantName: string;
  logo?: string | null;
  sections: FormSection[];
  jobPositions?: JobPosition[];
  theme: TenantTheme;
  themeMode?: ThemeMode;
  introText?: string;
}

export function TenantFormExperience({
  slug,
  tenantName,
  logo,
  sections,
  jobPositions = [],
  theme,
  themeMode = "system",
  introText,
}: Props) {
  const [started, setStarted] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const { mode, toggle } = useFormTheme(themeMode === "system" ? "system" : themeMode);

  const activePositions = jobPositions.filter((p) => p.active);

  const instructions =
    introText ??
    "Completa cada paso con información verídica. Necesitarás tu cédula, datos de contacto, CV en PDF y una foto reciente.";

  function handleStartWithPosition(posTitle?: string) {
    if (posTitle) setSelectedPosition(posTitle);
    setStarted(true);
  }

  return (
    <FormShell mode={mode} theme={theme}>
      <header className="form-header">
        <div className="flex items-center justify-between w-full max-w-3xl px-4 py-4 mx-auto sm:px-6">
          <TalentoLinkLogo size="sm" />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggle}
              className="form-theme-toggle"
              aria-label={mode === "dark" ? "Modo claro" : "Modo oscuro"}
            >
              {mode === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <Link href="/" className="text-xs form-muted hover:opacity-80 transition-opacity">
              forms.renace.tech
            </Link>
          </div>
        </div>
      </header>

      <main className="flex flex-col items-center flex-1 px-4 py-8 sm:py-10 tl-page-enter">
        <div className="w-full max-w-2xl text-center mb-6">
          <TenantBrandLogo
            name={tenantName}
            logo={logo}
            tenantSlug={slug}
            primary={theme.primary}
            accent={theme.accent}
            size="md"
            className="mb-4"
          />
          <h1 className="text-xl font-bold form-title sm:text-2xl tracking-tight">{tenantName}</h1>
          <p className="mt-1.5 text-sm form-muted">Bolsa de Empleo y Solicitudes de Personal</p>
        </div>

        <div className="w-full max-w-2xl">
          {!started ? (
            <IntroAndPositionsCard
              tenantName={tenantName}
              instructions={instructions}
              positions={activePositions}
              theme={theme}
              onStart={handleStartWithPosition}
            />
          ) : (
            <TenantApplicationForm
              slug={slug}
              tenantName={tenantName}
              sections={sections}
              initialValues={selectedPosition ? { area_aplicar: selectedPosition } : undefined}
              theme={theme}
              colorMode={mode}
            />
          )}
        </div>

        <p className="mt-6 text-[10px] form-footer">Tus datos están protegidos y son confidenciales</p>
      </main>
    </FormShell>
  );
}

const workTypeLabels: Record<WorkType, string> = {
  full_time: "Tiempo completo",
  part_time: "Medio tiempo",
  remote: "Remoto / Híbrido",
  temporary: "Temporal / Temporada",
  internship: "Pasantía",
};

function IntroAndPositionsCard({
  tenantName,
  instructions,
  positions,
  theme,
  onStart,
}: {
  tenantName: string;
  instructions: string;
  positions: JobPosition[];
  theme: TenantTheme;
  onStart: (posTitle?: string) => void;
}) {
  return (
    <div className="form-card p-6 sm:p-8 animate-tl-scale-in space-y-6">
      {/* SECCIÓN DE VACANTES ABIERTAS */}
      {positions.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h2 className="text-base font-bold form-title flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-teal-400" />
                Vacantes Abiertas Actualmente ({positions.length})
              </h2>
              <p className="text-xs form-muted mt-0.5">
                Selecciona la posición de tu interés para comenzar tu postulación
              </p>
            </div>
            <span className="hidden sm:inline-flex px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
              Contratando ahora
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-1">
            {positions.map((pos) => (
              <div
                key={pos.id}
                onClick={() => onStart(pos.title)}
                className="group relative p-4 rounded-2xl border border-white/10 bg-white/[0.02] hover:border-teal-400/50 hover:bg-white/[0.04] transition-all cursor-pointer shadow-md hover:shadow-teal-500/5 text-left"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold form-title group-hover:text-teal-300 transition-colors">
                        {pos.title}
                      </h3>
                      {pos.featured && (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          ⭐ Urgente
                        </span>
                      )}
                      {pos.department && (
                        <span className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-white/5 form-muted border border-white/10">
                          {pos.department}
                        </span>
                      )}
                    </div>

                    {pos.description && (
                      <p className="text-xs form-muted line-clamp-2 leading-relaxed">
                        {pos.description}
                      </p>
                    )}

                    {pos.requirements && (
                      <p className="text-[11px] form-muted italic line-clamp-1">
                        <strong>Requisitos:</strong> {pos.requirements}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] form-muted">
                      {pos.salaryRange && (
                        <span className="flex items-center gap-1 text-teal-300 font-semibold">
                          <DollarSign className="w-3 h-3" />
                          {pos.salaryRange}
                        </span>
                      )}
                      {pos.workType && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-indigo-400" />
                          {workTypeLabels[pos.workType]}
                        </span>
                      )}
                      {pos.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-cyan-400" />
                          {pos.location}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="shrink-0 self-start sm:self-center px-4 py-2 text-xs font-semibold rounded-xl text-white transition-all group-hover:opacity-100 opacity-90 flex items-center gap-1.5"
                    style={{
                      background: `linear-gradient(135deg, ${theme.accent}, ${theme.primary})`,
                    }}
                  >
                    Postularme
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => onStart()}
              className="text-xs form-muted hover:text-white underline transition-colors"
            >
              ¿Deseas enviar una candidatura espontánea o para otro puesto? Haz clic aquí
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold form-title">Antes de empezar</h2>
          <p className="text-sm leading-relaxed form-muted">{instructions}</p>

          <button
            type="button"
            onClick={() => onStart()}
            className="w-full py-3.5 text-sm font-semibold rounded-xl text-white transition-all hover:opacity-95 active:scale-[0.98]"
            style={{
              background: `linear-gradient(135deg, ${theme.accent}, ${theme.primary})`,
              boxShadow: `0 12px 32px -8px ${theme.primary}88`,
            }}
          >
            <span className="inline-flex items-center justify-center gap-2">
              Comenzar solicitud
              <ArrowRight className="w-4 h-4" />
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

function FormShell({
  mode,
  theme,
  children,
}: {
  mode: FormColorMode;
  theme: TenantTheme;
  children: React.ReactNode;
}) {
  const isDark = mode === "dark";
  const bg = isDark ? theme.bg : "#f4f6fa";

  return (
    <div
      className={`form-root flex flex-col min-h-screen min-h-[100dvh] ${isDark ? "form-dark" : "form-light"}`}
      style={{
        background: isDark
          ? `radial-gradient(ellipse 80% 50% at 50% -20%, ${theme.primary}33, transparent), ${bg}`
          : `linear-gradient(180deg, color-mix(in srgb, ${theme.primary} 12%, white) 0%, ${bg} 50%)`,
        ["--form-primary" as string]: theme.primary,
        ["--form-accent" as string]: theme.accent,
      }}
    >
      {children}
    </div>
  );
}
