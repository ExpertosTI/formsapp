"use client";

import { useState, FormEvent, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Building2, Loader2, Plus, Link2, Copy, Check, ImagePlus, Trash2 } from "lucide-react";
import { slugify } from "@/lib/slug";
import { TenantBrandLogo } from "@/components/forms/TenantBrandLogo";
import type { FormType } from "@/lib/form-config";

export function CreateTenantForm() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdUrl, setCreatedUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [formType, setFormType] = useState<FormType>("simple");
  const [primaryColor, setPrimaryColor] = useState("#1b2055");
  const [accentColor, setAccentColor] = useState("#2dd4bf");
  const [backgroundColor, setBackgroundColor] = useState("#0f172a");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  useEffect(() => {
    return () => {
      if (logoPreview?.startsWith("blob:")) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);

  function onNameChange(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  function onLogoPick(file: File | null) {
    if (logoPreview?.startsWith("blob:")) URL.revokeObjectURL(logoPreview);
    if (!file) {
      setLogoFile(null);
      setLogoPreview(null);
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  function clearLogo() {
    if (logoPreview?.startsWith("blob:")) URL.revokeObjectURL(logoPreview);
    setLogoFile(null);
    setLogoPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setCreatedUrl("");

    const fd = new FormData(e.currentTarget);
    if (logoFile) fd.set("logo", logoFile);

    const res = await fetch("/api/tenants", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setCreatedUrl(`https://forms.renace.tech${data.formUrl}`);
      router.refresh();
    } else {
      setError(data.error ?? "No se pudo crear");
    }
    setLoading(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center justify-center w-full gap-2 p-4 mb-6 text-sm font-semibold border border-dashed rounded-2xl border-teal-500/30 text-teal-300 bg-teal-500/5 hover:bg-teal-500/10 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Registrar nueva empresa
      </button>
    );
  }

  const previewSlug = slug || "empresa";

  return (
    <div className="p-5 mb-6 tl-card border-teal-500/20">
      <div className="flex items-center gap-2 mb-4">
        <Building2 className="w-5 h-5 text-teal-400" />
        <h2 className="font-semibold text-white">Nueva empresa</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="tl-label">Nombre comercial *</label>
            <input
              name="name"
              required
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              className="tl-input"
              placeholder="Mi Boutique SRL"
            />
          </div>
          <div>
            <label className="tl-label">URL corta (slug) *</label>
            <input
              id="tenant-slug"
              name="slug"
              required
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
              className="tl-input font-mono text-xs"
              placeholder="mi-boutique"
            />
            <p className="mt-1 text-[10px] text-slate-500">
              forms.renace.tech/forms/<span className="text-teal-400">{previewSlug}</span>
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="tl-label">Correo administrador *</label>
            <input name="adminEmail" type="email" required className="tl-input" placeholder="admin@empresa.com" />
          </div>
          <div>
            <label className="tl-label">Contraseña inicial *</label>
            <input name="adminPassword" type="password" required minLength={8} className="tl-input" placeholder="Mínimo 8 caracteres" />
          </div>
        </div>

        <div>
          <label className="tl-label">Formulario de candidatos a utilizar *</label>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setFormType("simple")}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                formType === "simple"
                  ? "border-teal-400 bg-teal-500/10 text-white"
                  : "border-white/10 bg-white/[0.02] text-slate-400 hover:border-white/20"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold">Simplificado (Recomendado)</span>
                {formType === "simple" && <Check className="w-3.5 h-3.5 text-teal-400" />}
              </div>
              <p className="text-[11px] leading-relaxed text-slate-400">
                Formulario corto de 3 pasos: área deseada, datos personales, ubicación y CV.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setFormType("full")}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                formType === "full"
                  ? "border-teal-400 bg-teal-500/10 text-white"
                  : "border-white/10 bg-white/[0.02] text-slate-400 hover:border-white/20"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold">Completo (Exhaustivo)</span>
                {formType === "full" && <Check className="w-3.5 h-3.5 text-teal-400" />}
              </div>
              <p className="text-[11px] leading-relaxed text-slate-400">
                Formulario completo multipaso con experiencia laboral previa, educación y referencias.
              </p>
            </button>
          </div>
          <input type="hidden" name="formType" value={formType} />
        </div>

        <div>
          <label className="tl-label">Logo de la empresa</label>
          <p className="mb-2 text-[10px] text-slate-500">JPG, PNG, WEBP o GIF · máximo 2 MB</p>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => fileRef.current?.click()} className="tl-btn-ghost">
              <ImagePlus className="w-4 h-4" />
              {logoPreview ? "Cambiar logo" : "Subir logo"}
            </button>
            {logoPreview && (
              <button type="button" onClick={clearLogo} className="tl-btn-ghost text-red-300/90">
                <Trash2 className="w-4 h-4" />
                Quitar
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
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <ColorField label="Color principal" name="primaryColor" value={primaryColor} onChange={setPrimaryColor} />
          <ColorField label="Color acento" name="accentColor" value={accentColor} onChange={setAccentColor} />
          <ColorField
            label="Color de contraste"
            name="backgroundColor"
            value={backgroundColor}
            onChange={setBackgroundColor}
            hint="Fondo del formulario"
          />
        </div>

        <section className="p-4 rounded-xl border border-white/10">
          <p className="mb-3 text-xs font-semibold text-slate-400">Vista previa del formulario</p>
          <div
            className="flex flex-col items-center p-6 rounded-xl"
            style={{
              background: `radial-gradient(ellipse 80% 50% at 50% -20%, ${primaryColor}33, transparent), ${backgroundColor}`,
            }}
          >
            <TenantBrandLogo
              name={name || "Tu empresa"}
              logo={logoPreview}
              tenantSlug={previewSlug}
              primary={primaryColor}
              accent={accentColor}
              size="md"
              className="mb-3"
            />
            <p className="text-base font-bold text-white">{name || "Tu empresa"}</p>
            <p className="mt-1 text-xs" style={{ color: accentColor }}>
              Solicitud de empleo
            </p>
            <button
              type="button"
              tabIndex={-1}
              className="mt-4 w-full max-w-xs py-2.5 text-xs font-semibold rounded-lg text-white pointer-events-none"
              style={{
                background: `linear-gradient(135deg, ${accentColor}, ${primaryColor})`,
                boxShadow: `0 8px 24px -6px ${primaryColor}88`,
              }}
            >
              Comenzar solicitud
            </button>
          </div>
        </section>

        {error && <p className="text-sm text-red-400">{error}</p>}

        {createdUrl && (
          <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/20">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-teal-300 mb-2">
              <Link2 className="w-3.5 h-3.5" />
              Empresa creada
            </p>
            <p className="text-xs text-slate-400 break-all">{createdUrl}</p>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(createdUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="inline-flex items-center gap-1 mt-2 text-xs text-teal-400"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? "Copiado" : "Copiar enlace del formulario"}
            </button>
          </div>
        )}

        <div className="flex gap-2">
          <button type="button" onClick={() => setOpen(false)} className="tl-btn-ghost flex-1">
            Cerrar
          </button>
          <button type="submit" disabled={loading} className="tl-btn-primary flex-1">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Crear empresa"}
          </button>
        </div>
      </form>
    </div>
  );
}

function ColorField({
  label,
  name,
  value,
  onChange,
  hint,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  return (
    <div>
      <label className="tl-label">{label}</label>
      <div className="flex items-center gap-2">
        <input
          name={name}
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
      {hint && <p className="mt-1 text-[10px] text-slate-500">{hint}</p>}
    </div>
  );
}
