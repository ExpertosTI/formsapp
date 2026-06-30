"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2, Send } from "lucide-react";
import type { FormSection } from "@/lib/form-config";
import { useFormTelemetry, type FormColorMode } from "@/hooks/useFormTelemetry";
import { RdLocationFields } from "./RdLocationFields";

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
  colorMode: FormColorMode;
}

export function TenantApplicationForm({ slug, tenantName, sections, theme, colorMode }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [multiValues, setMultiValues] = useState<Record<string, string[]>>({});
  const formRef = useRef<HTMLFormElement>(null);

  const totalFields = sections.reduce((n, s) => n + s.fields.length, 0);
  const { onFieldFocus, onStepChange, buildTelemetry } = useFormTelemetry(totalFields);

  const current = sections[step];
  const isLast = step === sections.length - 1;

  const toggleMulti = useCallback((key: string, option: string) => {
    setMultiValues((prev) => {
      const cur = prev[key] ?? [];
      const next = cur.includes(option) ? cur.filter((o) => o !== option) : [...cur, option];
      return { ...prev, [key]: next };
    });
  }, []);

  function countFilled(fd: FormData): number {
    let n = 0;
    for (const section of sections) {
      for (const field of section.fields) {
        if (field.type === "file") {
          const f = fd.get(field.key);
          if (f instanceof File && f.size > 0) n++;
        } else if (field.type === "multiselect") {
          if ((multiValues[field.key] ?? []).length > 0) n++;
        } else {
          const v = String(fd.get(field.key) ?? "").trim();
          if (v) n++;
        }
      }
    }
    return n;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isLast) {
      const next = step + 1;
      setStep(next);
      onStepChange(next);
      return;
    }

    setLoading(true);
    setError("");

    for (const section of sections) {
      for (const field of section.fields) {
        if (field.type === "multiselect" && field.required && !(multiValues[field.key] ?? []).length) {
          setError(`Selecciona al menos una opción: ${field.label}`);
          setLoading(false);
          return;
        }
      }
    }

    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("tenant_slug", slug);

    for (const [key, vals] of Object.entries(multiValues)) {
      if (vals.length) fd.set(key, vals.join(", "));
    }

    const telemetry = buildTelemetry(countFilled(fd));
    fd.set("_telemetry", JSON.stringify(telemetry));

    const res = await fetch("/api/submissions", { method: "POST", body: fd });
    if (res.ok) {
      setDone(true);
      router.refresh();
    } else {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "No se pudo enviar la solicitud");
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="p-8 text-center form-card animate-tl-scale-in">
        <CheckCircle2 className="w-14 h-14 mx-auto mb-4" style={{ color: theme.accent }} />
        <h2 className="text-xl font-bold form-title">¡Solicitud enviada!</h2>
        <p className="mt-2 text-sm form-muted">
          {tenantName} recibirá tu información. Gracias por aplicar.
        </p>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="form-card p-6 sm:p-8 animate-tl-fade-in">
      <div className="flex gap-1 mb-2">
        {sections.map((s, i) => (
          <div
            key={s.id}
            className="flex-1 h-1.5 rounded-full transition-all duration-500"
            style={{
              background:
                i <= step
                  ? `linear-gradient(90deg, ${theme.accent}, ${theme.primary})`
                  : colorMode === "dark"
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(0,0,0,0.08)",
            }}
          />
        ))}
      </div>

      <p className="mb-1 text-[10px] font-bold uppercase tracking-widest form-muted">
        Paso {step + 1} de {sections.length}
      </p>
      <h2 className="mb-5 text-lg font-semibold form-title">{current.title}</h2>

      <div className="space-y-4">
        {current.fields.map((field) =>
          field.type === "location" ? (
            <RdLocationFields key={field.key} onFocus={onFieldFocus} />
          ) : (
          <div key={field.key}>
            <label className="form-label">
              {field.label}
              {field.required ? " *" : ""}
            </label>

            {field.type === "textarea" ? (
              <textarea
                name={field.key}
                required={field.required}
                rows={3}
                placeholder={field.placeholder}
                onFocus={onFieldFocus}
                className="form-input resize-y min-h-[88px]"
              />
            ) : field.type === "select" ? (
              <select
                name={field.key}
                required={field.required}
                onFocus={onFieldFocus}
                className="form-input"
              >
                <option value="">Seleccionar…</option>
                {field.options?.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            ) : field.type === "multiselect" ? (
              <div className="flex flex-wrap gap-2" onFocus={onFieldFocus}>
                {field.options?.map((o) => {
                  const selected = (multiValues[field.key] ?? []).includes(o);
                  return (
                    <button
                      key={o}
                      type="button"
                      onClick={() => toggleMulti(field.key, o)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                        selected ? "text-white border-transparent" : "form-chip"
                      }`}
                      style={
                        selected
                          ? { background: `linear-gradient(135deg, ${theme.accent}, ${theme.primary})` }
                          : undefined
                      }
                    >
                      {o}
                    </button>
                  );
                })}
                <input type="hidden" name={field.key} value={(multiValues[field.key] ?? []).join(", ")} />
              </div>
            ) : field.type === "file" ? (
              <input
                name={field.key}
                type="file"
                required={field.required}
                accept={field.accept}
                onFocus={onFieldFocus}
                className="form-input file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-black/10 file:text-inherit"
              />
            ) : (
              <input
                name={field.key}
                type={field.type === "url" ? "url" : field.type}
                required={field.required}
                placeholder={field.placeholder}
                onFocus={onFieldFocus}
                className="form-input"
              />
            )}
          </div>
          )
        )}
      </div>

      {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

      <div className="flex gap-3 mt-8">
        {step > 0 && (
          <button type="button" onClick={() => setStep((s) => s - 1)} className="form-btn-ghost flex-1">
            <ChevronLeft className="w-4 h-4" />
            Atrás
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-3 text-sm font-semibold rounded-xl text-white transition-all hover:opacity-95 active:scale-[0.98] disabled:opacity-60"
          style={{
            background: `linear-gradient(135deg, ${theme.accent}, ${theme.primary})`,
            boxShadow: `0 8px 24px -6px ${theme.primary}66`,
          }}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mx-auto animate-spin" />
          ) : isLast ? (
            <span className="inline-flex items-center justify-center gap-2">
              <Send className="w-4 h-4" />
              Enviar solicitud
            </span>
          ) : (
            <span className="inline-flex items-center justify-center gap-2">
              Siguiente
              <ChevronRight className="w-4 h-4" />
            </span>
          )}
        </button>
      </div>
    </form>
  );
}
