"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2, Send } from "lucide-react";
import type { FormSection } from "@/lib/form-config";

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
}

export function TenantApplicationForm({ slug, tenantName, sections, theme }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const current = sections[step];
  const isLast = step === sections.length - 1;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isLast) {
      setStep((s) => s + 1);
      return;
    }

    setLoading(true);
    setError("");
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("tenant_slug", slug);

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
      <div className="p-8 text-center tl-card animate-tl-scale-in">
        <CheckCircle2 className="w-14 h-14 mx-auto mb-4" style={{ color: theme.accent }} />
        <h2 className="text-xl font-bold text-white">¡Solicitud enviada!</h2>
        <p className="mt-2 text-sm text-slate-400">
          {tenantName} recibirá tu información. Gracias por aplicar.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="tl-card p-6 sm:p-8">
      <div className="flex gap-1 mb-6">
        {sections.map((s, i) => (
          <div
            key={s.id}
            className="flex-1 h-1.5 rounded-full transition-all duration-300"
            style={{
              background: i <= step ? `linear-gradient(90deg, ${theme.accent}, ${theme.primary})` : "rgba(255,255,255,0.08)",
            }}
          />
        ))}
      </div>

      <h2 className="mb-1 text-lg font-semibold text-white">{current.title}</h2>
      <p className="mb-6 text-xs text-slate-500">
        Paso {step + 1} de {sections.length}
      </p>

      <div className="space-y-4">
        {current.fields.map((field) => (
          <div key={field.key}>
            <label className="tl-label">{field.label}{field.required ? " *" : ""}</label>
            {field.type === "textarea" ? (
              <textarea name={field.key} required={field.required} rows={3} className="tl-input resize-y min-h-[80px]" />
            ) : field.type === "select" ? (
              <select name={field.key} required={field.required} className="tl-input">
                <option value="">Seleccionar…</option>
                {field.options?.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            ) : field.type === "file" ? (
              <input name={field.key} type="file" required={field.required} accept={field.accept} className="tl-input file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white" />
            ) : (
              <input name={field.key} type={field.type} required={field.required} className="tl-input" />
            )}
          </div>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      <div className="flex gap-3 mt-8">
        {step > 0 && (
          <button type="button" onClick={() => setStep((s) => s - 1)} className="tl-btn-ghost flex-1">
            <ChevronLeft className="w-4 h-4" />
            Atrás
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-3 text-sm font-semibold rounded-xl text-white transition-all hover:opacity-95 active:scale-[0.98] disabled:opacity-60"
          style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.primary})` }}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mx-auto animate-spin" />
          ) : isLast ? (
            <span className="inline-flex items-center justify-center gap-2"><Send className="w-4 h-4" />Enviar solicitud</span>
          ) : (
            <span className="inline-flex items-center justify-center gap-2">Siguiente<ChevronRight className="w-4 h-4" /></span>
          )}
        </button>
      </div>
    </form>
  );
}
