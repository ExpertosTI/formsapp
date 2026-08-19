"use client";

import { useState, FormEvent, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Trash2, Check, ExternalLink } from "lucide-react";
import Link from "next/link";
import { TenantBrandLogo } from "@/components/forms/TenantBrandLogo";
import type { FormType, TenantSettings, ThemeMode } from "@/lib/form-config";

export interface TenantBrandingInitial {
  slug: string;
  name: string;
  logo: string | null;
  senderName: string | null;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  settings: TenantSettings | null;
}

interface Props {
  tenant: TenantBrandingInitial;
}

export function TenantBrandingForm({ tenant }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const settings = (tenant.settings ?? {}) as TenantSettings;

  const [name, setName] = useState(tenant.name);
  const [senderName, setSenderName] = useState(tenant.senderName ?? "");
  const [primaryColor, setPrimaryColor] = useState(tenant.primaryColor || "#1b2055");
  const [accentColor, setAccentColor] = useState(tenant.accentColor || "#2dd4bf");
  const [backgroundColor, setBackgroundColor] = useState(tenant.backgroundColor || "#0f172a");
  const [formType, setFormType] = useState<FormType>(settings.formType ?? "simple");
  const sectionFlags = settings.sections ?? {};
  const [showCompensacion, setShowCompensacion] = useState(sectionFlags.modalidad_compensacion !== false);
  const [showCapacitacion, setShowCapacitacion] = useState(sectionFlags.disposicion_capacitacion !== false);
  const [showAporte, setShowAporte] = useState(sectionFlags.aporte_empresa !== false);

  const [introText, setIntroText] = useState(settings.introText ?? "");
  const [themeMode, setThemeMode] = useState<ThemeMode>(settings.themeMode ?? "system");
  const [logoPath, setLogoPath] = useState(tenant.logo);
  /** Solo blob: al elegir archivo nuevo; el logo guardado se resuelve con logoPath + slug */
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function onLogoPick(file: File | null) {
    if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    if (!file) {
      setLogoFile(null);
      setPreviewUrl(null);
      return;
    }
    setLogoFile(file);
    setRemoveLogo(false);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function clearLogo() {
    if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setLogoFile(null);
    setRemoveLogo(true);
    setLogoPath(null);
    setPreviewUrl(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSaved(false);

    const fd = new FormData();
    fd.set("name", name);
    fd.set("senderName", senderName);
    fd.set("primaryColor", primaryColor);
    fd.set("accentColor", accentColor);
    fd.set("backgroundColor", backgroundColor);
    fd.set("formType", formType);
    fd.set(
      "sections",
      JSON.stringify({
        ...sectionFlags,
        modalidad_compensacion: showCompensacion,
        disposicion_capacitacion: showCapacitacion,
        aporte_empresa: showAporte,
      })
    );
    fd.set("introText", introText);
    fd.set("themeMode", themeMode);
    if (removeLogo) fd.set("removeLogo", "1");
    if (logoFile) fd.set("logo", logoFile);

    const res = await fetch(`/api/tenants/${tenant.slug}`, { method: "PATCH", body: fd });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data.error ?? "No se pudo guardar");
      setLoading(false);
      return;
    }

    const updated = data.tenant;
    setLogoPath(updated.logo);
    setRemoveLogo(false);
    setLogoFile(null);
    if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileRef.current) fileRef.current.value = "";
    setSaved(true);
    setLoading(false);
    router.refresh();
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="p-5 sm:p-6 tl-card">
        <h2 className="mb-1 text-sm font-semibold text-white">Vista previa</h2>
        <p className="mb-5 text-xs text-slate-500">Así se verá el logo en tu formulario público</p>
        <div
          className="flex flex-col items-center p-8 rounded-2xl border border-white/10"
          style={{
            background: `radial-gradient(ellipse 80% 50% at 50% -20%, ${primaryColor}33, transparent), ${backgroundColor}`,
          }}
        >
          <TenantBrandLogo
            name={name || tenant.name}
            logo={previewUrl ?? logoPath}
            tenantSlug={tenant.slug}
            primary={primaryColor}
            accent={accentColor}
            size="lg"
            className="mb-3"
          />
          <p className="text-lg font-bold text-white">{name || "Tu empresa"}</p>
          <p className="mt-1 text-xs" style={{ color: accentColor }}>
            Solicitud de empleo
          </p>
        </div>
      </section>

      <section className="p-5 sm:p-6 tl-card space-y-4">
        <h2 className="text-sm font-semibold text-white">Datos de la empresa</h2>

        <div>
          <label className="tl-label" htmlFor="brand-name">
            Nombre comercial *
          </label>
          <input
            id="brand-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
            className="tl-input"
            placeholder="Mi Boutique SRL"
          />
        </div>

        <div>
          <label className="tl-label" htmlFor="brand-sender">
            Nombre corto / remitente
          </label>
          <input
            id="brand-sender"
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
            className="tl-input"
            placeholder="Opcional, ej. RRHH Boutique"
          />
          <p className="mt-1 text-[10px] text-slate-500">Se usa como nombre amigable de la marca</p>
        </div>

        <div>
          <label className="tl-label" htmlFor="brand-intro">
            Texto de bienvenida del formulario
          </label>
          <textarea
            id="brand-intro"
            value={introText}
            onChange={(e) => setIntroText(e.target.value)}
            rows={3}
            className="tl-input resize-y min-h-[80px]"
            placeholder="Completa cada paso con información verídica…"
          />
        </div>
      </section>

      <section className="p-5 sm:p-6 tl-card space-y-4">
        <h2 className="text-sm font-semibold text-white">Formulario de candidatos</h2>
        <p className="text-xs text-slate-400">
          Elige qué tipo de formulario llenarán los postulantes de tu empresa.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setFormType("simple")}
            className={`p-4 rounded-xl border text-left transition-all ${
              formType === "simple"
                ? "border-teal-400 bg-teal-500/10 text-white"
                : "border-white/10 bg-white/[0.02] text-slate-400 hover:border-white/20"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold">Simplificado (Recomendado)</span>
              {formType === "simple" && <Check className="w-4 h-4 text-teal-400" />}
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Formulario corto de 3 pasos: selección de área, datos personales básicos, ubicación y curriculum.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setFormType("full")}
            className={`p-4 rounded-xl border text-left transition-all ${
              formType === "full"
                ? "border-teal-400 bg-teal-500/10 text-white"
                : "border-white/10 bg-white/[0.02] text-slate-400 hover:border-white/20"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold">Completo (Exhaustivo)</span>
              {formType === "full" && <Check className="w-4 h-4 text-teal-400" />}
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Formulario completo multipaso con experiencia laboral previa, preparación académica y referencias.
            </p>
          </button>
        </div>

        <div className="pt-4 border-t border-white/10 space-y-3">
          <p className="text-xs font-semibold text-white">Preguntas de expectativas y metas (Activar / Desactivar)</p>
          <label className="flex items-start gap-3 cursor-pointer text-xs text-slate-300">
            <input
              type="checkbox"
              checked={showCompensacion}
              onChange={(e) => setShowCompensacion(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-white/20 bg-white/5 text-teal-500 focus:ring-teal-400 shrink-0"
            />
            <span>
              <strong>Modalidad de compensación:</strong> ¿Qué modalidad de compensación prefieres? (Sueldo fijo, comisiones, etc.)
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer text-xs text-slate-300">
            <input
              type="checkbox"
              checked={showCapacitacion}
              onChange={(e) => setShowCapacitacion(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-white/20 bg-white/5 text-teal-500 focus:ring-teal-400 shrink-0"
            />
            <span>
              <strong>Capacitación y resultados:</strong> ¿Estás dispuesto/a a capacitarte, cumplir metas y trabajar bajo resultados?
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer text-xs text-slate-300">
            <input
              type="checkbox"
              checked={showAporte}
              onChange={(e) => setShowAporte(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-white/20 bg-white/5 text-teal-500 focus:ring-teal-400 shrink-0"
            />
            <span>
              <strong>Aporte a la empresa:</strong> ¿Qué estarías dispuesto/a a aportar para crecer, alcanzar metas y contribuir al éxito del equipo?
            </span>
          </label>
        </div>
      </section>

      <section className="p-5 sm:p-6 tl-card space-y-4">
        <h2 className="text-sm font-semibold text-white">Logo</h2>
        <p className="text-xs text-slate-500">JPG, PNG, WEBP o GIF · máximo 2 MB</p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="tl-btn-ghost"
          >
            <ImagePlus className="w-4 h-4" />
            {previewUrl || logoPath ? "Cambiar logo" : "Subir logo"}
          </button>
          {(previewUrl || logoPath) && (
            <button type="button" onClick={clearLogo} className="tl-btn-ghost text-red-300/90">
              <Trash2 className="w-4 h-4" />
              Quitar logo
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => onLogoPick(e.target.files?.[0] ?? null)}
          />
        </div>
      </section>

      <section className="p-5 sm:p-6 tl-card space-y-4">
        <h2 className="text-sm font-semibold text-white">Colores de marca</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <ColorField label="Principal" value={primaryColor} onChange={setPrimaryColor} />
          <ColorField label="Acento" value={accentColor} onChange={setAccentColor} />
          <ColorField label="Contraste (fondo)" value={backgroundColor} onChange={setBackgroundColor} />
        </div>

        <div>
          <label className="tl-label" htmlFor="brand-theme">
            Tema del formulario
          </label>
          <select
            id="brand-theme"
            value={themeMode}
            onChange={(e) => setThemeMode(e.target.value as ThemeMode)}
            className="tl-input"
          >
            <option value="system">Según el dispositivo</option>
            <option value="dark">Oscuro</option>
            <option value="light">Claro</option>
          </select>
        </div>
      </section>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button type="submit" disabled={loading} className="tl-btn-primary flex-1 sm:flex-none sm:min-w-[180px]">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <>
              <Check className="w-4 h-4" />
              Guardado
            </>
          ) : (
            "Guardar cambios"
          )}
        </button>
        <Link
          href={`/forms/${tenant.slug}`}
          target="_blank"
          className="tl-btn-ghost flex-1 sm:flex-none"
        >
          <ExternalLink className="w-4 h-4" />
          Ver formulario
        </Link>
      </div>
    </form>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="tl-label">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-10 rounded-lg cursor-pointer bg-transparent border border-white/10 shrink-0"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          pattern="^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$"
          className="tl-input font-mono text-xs"
        />
      </div>
    </div>
  );
}
