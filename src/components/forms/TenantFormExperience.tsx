"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Moon, Sun } from "lucide-react";
import type { FormSection, ThemeMode } from "@/lib/form-config";
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
  theme: TenantTheme;
  themeMode?: ThemeMode;
  introText?: string;
}

export function TenantFormExperience({
  slug,
  tenantName,
  logo,
  sections,
  theme,
  themeMode = "system",
  introText,
}: Props) {
  const [started, setStarted] = useState(false);
  const { mode, toggle } = useFormTheme(themeMode === "system" ? "system" : themeMode);

  const instructions =
    introText ??
    "Completa cada paso con información verídica. Necesitarás tu cédula, datos de contacto, CV en PDF y una foto reciente.";

  return (
    <FormShell mode={mode} theme={theme}>
      <header className="form-header">
        <div className="flex items-center justify-between w-full max-w-2xl px-4 py-4 mx-auto sm:px-6">
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
        <div className="w-full max-w-lg text-center mb-6">
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
          <p className="mt-1.5 text-sm form-muted">Solicitud de empleo</p>
        </div>

        <div className="w-full max-w-lg">
          {!started ? (
            <IntroCard instructions={instructions} theme={theme} onStart={() => setStarted(true)} />
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

        <p className="mt-6 text-[10px] form-footer">Tus datos están protegidos</p>
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
      <h2 className="mb-3 text-lg font-semibold form-title">Antes de empezar</h2>
      <p className="text-sm leading-relaxed form-muted mb-8">{instructions}</p>

      <button
        type="button"
        onClick={onStart}
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
