"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Moon, Shield, Sparkles, Sun, Clock } from "lucide-react";
import type { FormSection, ThemeMode } from "@/lib/form-config";
import { TenantApplicationForm } from "./TenantApplicationForm";
import { TenantBrandLogo } from "./TenantBrandLogo";
import { useFormTheme, type FormColorMode } from "@/hooks/useFormTelemetry";

interface TenantTheme {
  primary: string;
  accent: string;
  bg: string;
}

interface Props {
  slug: string;
  tenantName: string;
  sections: FormSection[];
  theme: TenantTheme;
  themeMode?: ThemeMode;
  introText?: string;
}

export function TenantFormExperience({
  slug,
  tenantName,
  sections,
  theme,
  themeMode = "system",
  introText,
}: Props) {
  const [started, setStarted] = useState(false);
  const { mode, toggle } = useFormTheme(themeMode === "system" ? "system" : themeMode);

  const instructions =
    introText ??
    "Completa el formulario con información verídica. Adjunta tu CV actualizado y una foto reciente. Tu perfil será evaluado automáticamente para encontrar el mejor puesto.";

  return (
    <FormShell mode={mode} theme={theme}>
      <header className="form-header">
        <div className="flex items-center justify-between w-full max-w-2xl px-4 py-4 mx-auto sm:px-6">
          <div className="flex items-center gap-2 text-xs form-muted">
            <Sparkles className="w-3.5 h-3.5" style={{ color: theme.accent }} />
            <span className="font-semibold tracking-wide">TalentoLink</span>
          </div>
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

      <main className="flex flex-col items-center flex-1 px-4 py-8 sm:py-12 tl-page-enter">
        <div className="w-full max-w-lg text-center mb-8">
          <TenantBrandLogo
            name={tenantName}
            primary={theme.primary}
            accent={theme.accent}
            size="md"
            className="mb-5"
          />
          <h1 className="text-xl font-bold form-title sm:text-3xl tracking-tight">{tenantName}</h1>
          <p className="mt-2 text-sm form-muted">Solicitud de empleo</p>
        </div>

        <div className="w-full max-w-lg">
          {!started ? (
            <IntroCard
              instructions={instructions}
              theme={theme}
              onStart={() => setStarted(true)}
            />
          ) : (
            <TenantApplicationForm
              slug={slug}
              tenantName={tenantName}
              sections={sections}
              theme={theme}
              colorMode={mode}
            />
          )}
        </div>

        <p className="mt-8 text-[10px] form-footer">
          Powered by TalentoLink · Tus datos están protegidos
        </p>
      </main>
    </FormShell>
  );
}

function IntroCard({
  instructions,
  theme,
  onStart,
}: {
  instructions: string;
  theme: TenantTheme;
  onStart: () => void;
}) {
  return (
    <div className="form-card p-6 sm:p-8 animate-tl-scale-in">
      <div
        className="absolute inset-x-0 top-0 h-px opacity-60"
        style={{ background: `linear-gradient(90deg, transparent, ${theme.accent}, transparent)` }}
      />

      <div className="flex items-center gap-2 mb-4">
        <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: theme.accent }} />
        <h2 className="text-lg font-semibold form-title">Instrucciones</h2>
      </div>

      <p className="text-sm leading-relaxed form-muted mb-6">{instructions}</p>

      <div className="grid gap-3 mb-8 sm:grid-cols-3">
        {[
          { icon: Clock, label: "~5 min", sub: "Formulario corto" },
          { icon: Shield, label: "Seguro", sub: "Datos protegidos" },
          { icon: Sparkles, label: "IA", sub: "Evaluación automática" },
        ].map(({ icon: Icon, label, sub }) => (
          <div key={label} className="form-stat-pill">
            <Icon className="w-4 h-4 mx-auto mb-1 opacity-70" style={{ color: theme.accent }} />
            <p className="text-xs font-semibold form-title">{label}</p>
            <p className="text-[10px] form-muted">{sub}</p>
          </div>
        ))}
      </div>

      <div className="p-4 mb-6 rounded-xl border border-dashed form-dashed">
        <p className="text-xs text-center form-muted">
          Perfil tipo LinkedIn · Ubicación · Sectores · Puntuación inteligente
        </p>
      </div>

      <button
        type="button"
        onClick={onStart}
        className="w-full py-3.5 text-sm font-semibold rounded-xl text-white transition-all hover:opacity-95 active:scale-[0.98] shadow-lg"
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
          : `linear-gradient(180deg, ${theme.primary}08 0%, ${bg} 40%)`,
        ["--form-primary" as string]: theme.primary,
        ["--form-accent" as string]: theme.accent,
      }}
    >
      {children}
    </div>
  );
}
