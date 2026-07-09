"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2, Send } from "lucide-react";
import type { FormSection } from "@/lib/form-config";
import { useFormTelemetry, type FormColorMode } from "@/hooks/useFormTelemetry";
import { clearFormDraft, type FormDraft, loadFormDraft, useFormDraft } from "@/hooks/useFormDraft";
import { iconForField } from "@/lib/field-icons";
import {
  isValidCedulaFormat,
  isValidPhoneLandline,
  isValidPhoneMobile,
  maskForField,
} from "@/lib/rd-formats";
import { RdLocationFields, type RdLocationValues } from "./RdLocationFields";
import { FormMaskedInput } from "./FormMaskedInput";
import { FormMultiSelectCards, FormSelectCards } from "./FormSelectCards";

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

const EMPTY_LOCATION: RdLocationValues = {
  provincia: "",
  ciudad: "",
  sector: "",
  direccion: "",
};

export function TenantApplicationForm({ slug, tenantName, sections, theme, colorMode }: Props) {
  const router = useRouter();
  const [draftReady, setDraftReady] = useState(false);

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [multiValues, setMultiValues] = useState<Record<string, string[]>>({});
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [fileValues, setFileValues] = useState<Record<string, File>>({});
  const [fileMeta, setFileMeta] = useState<Record<string, { name: string; size: number }>>({});
  const [locationValues, setLocationValues] = useState<RdLocationValues>(EMPTY_LOCATION);
  const [telemetryMeta, setTelemetryMeta] = useState({
    startedAt: Date.now(),
    focusCount: 0,
    maxStep: 1,
  });
  const formRef = useRef<HTMLFormElement>(null);

  const totalFields = sections.reduce((n, s) => n + s.fields.length, 0);
  const { onFieldFocus, onStepChange, buildTelemetry, restoreTelemetry } = useFormTelemetry(
    totalFields,
    telemetryMeta.startedAt,
  );

  const hydrateDraft = useCallback(
    (loaded: FormDraft) => {
      setFormValues(loaded.formValues);
      setMultiValues(loaded.multiValues);
      setLocationValues(loaded.locationValues);
      setStep(loaded.step);
      setFileMeta(loaded.fileMeta);
      setTelemetryMeta({
        startedAt: loaded.startedAt,
        focusCount: loaded.focusCount,
        maxStep: loaded.maxStep,
      });
      restoreTelemetry(loaded.startedAt, loaded.focusCount, loaded.maxStep);
      setDraftReady(true);
    },
    [restoreTelemetry],
  );

  useEffect(() => {
    if (!loadFormDraft(slug)) setDraftReady(true);
  }, [slug]);

  const draftPayload = useMemo(
    () => ({
      formValues,
      multiValues,
      locationValues,
      step,
      startedAt: telemetryMeta.startedAt,
      focusCount: telemetryMeta.focusCount,
      maxStep: telemetryMeta.maxStep,
      fileMeta,
    }),
    [formValues, multiValues, locationValues, step, telemetryMeta, fileMeta],
  );

  useFormDraft(slug, draftPayload, hydrateDraft, draftReady);

  const current = sections[step];
  const isLast = step === sections.length - 1;

  const handleFocus = useCallback(() => {
    onFieldFocus();
    setTelemetryMeta((m) => ({ ...m, focusCount: m.focusCount + 1 }));
  }, [onFieldFocus]);

  const toggleMulti = useCallback((key: string, option: string) => {
    setMultiValues((prev) => {
      const cur = prev[key] ?? [];
      const next = cur.includes(option) ? cur.filter((o) => o !== option) : [...cur, option];
      return { ...prev, [key]: next };
    });
  }, []);

  const handleLocationChange = useCallback((values: RdLocationValues) => {
    setLocationValues(values);
  }, []);

  const setFieldValue = useCallback((key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  function captureCurrentStepValues(form: HTMLFormElement) {
    const fd = new FormData(form);
    const values = { ...formValues };
    const files = { ...fileValues };

    for (const field of current.fields) {
      if (field.type === "location") continue;
      if (field.type === "file") {
        const f = fd.get(field.key);
        if (f instanceof File && f.size > 0) files[field.key] = f;
      } else if (field.type !== "multiselect") {
        values[field.key] = String(fd.get(field.key) ?? "");
      }
    }

    return { values, files };
  }

  function buildFullFormData(
    values: Record<string, string> = formValues,
    files: Record<string, File> = fileValues,
  ): FormData {
    const fd = new FormData();
    fd.set("tenant_slug", slug);

    for (const section of sections) {
      for (const field of section.fields) {
        if (field.type === "location") {
          for (const [key, val] of Object.entries(locationValues)) {
            if (val) fd.set(key, val);
          }
          continue;
        }
        if (field.type === "file") {
          const f = files[field.key];
          if (f) fd.append(field.key, f);
          continue;
        }
        if (field.type === "multiselect") {
          const vals = multiValues[field.key] ?? [];
          if (vals.length) fd.set(field.key, vals.join(", "));
          continue;
        }
        const val = values[field.key];
        if (val) fd.set(field.key, val);
      }
    }

    return fd;
  }

  function countFilled(
    values: Record<string, string> = formValues,
    files: Record<string, File> = fileValues,
  ): number {
    let n = 0;
    for (const section of sections) {
      for (const field of section.fields) {
        if (field.type === "location") {
          if (Object.values(locationValues).every((v) => v.trim())) n++;
        } else if (field.type === "file") {
          if (files[field.key]) n++;
        } else if (field.type === "multiselect") {
          if ((multiValues[field.key] ?? []).length > 0) n++;
        } else if (values[field.key]?.trim()) {
          n++;
        }
      }
    }
    return n;
  }

  function goBack() {
    setError("");
    setStep((s) => Math.max(0, s - 1));
  }

  function validateCurrentStep(
    values: Record<string, string>,
    files: Record<string, File>,
  ): string | null {
    for (const field of current.fields) {
      if (field.type === "location") {
        if (field.required && !Object.values(locationValues).every((v) => v.trim())) {
          return "Completa tu ubicación";
        }
        continue;
      }
      if (field.type === "multiselect") {
        if (field.required && !(multiValues[field.key] ?? []).length) {
          return `Selecciona al menos una opción: ${field.label}`;
        }
        continue;
      }
      if (field.type === "file") {
        if (field.required && !files[field.key] && !fileMeta[field.key]) {
          return `Falta archivo: ${field.label}`;
        }
        continue;
      }
      const val = values[field.key]?.trim() ?? "";
      if (field.required && !val) {
        return `Campo requerido: ${field.label}`;
      }
      if (field.key === "cedula" && val && !isValidCedulaFormat(val)) {
        return "Ingresa los 11 dígitos de tu cédula (ej. 402-1234567-8)";
      }
      if (field.key === "celular" && val && !isValidPhoneMobile(val)) {
        return "Celular: 10 dígitos con indicativo 809, 829 o 849";
      }
      if (field.key === "tel_casa" && val && !isValidPhoneLandline(val)) {
        return "Teléfono de casa: 7 dígitos (555-1234) o 10 con indicativo";
      }
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const captured = captureCurrentStepValues(form);
    setFormValues(captured.values);
    setFileValues(captured.files);

    const validationError = validateCurrentStep(captured.values, captured.files);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");

    if (!isLast) {
      const next = step + 1;
      setStep(next);
      onStepChange(next);
      setTelemetryMeta((m) => ({ ...m, maxStep: Math.max(m.maxStep, next + 1) }));
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

    const fd = buildFullFormData(captured.values, captured.files);
    const telemetry = buildTelemetry(countFilled(captured.values, captured.files));
    fd.set("_telemetry", JSON.stringify(telemetry));

    const res = await fetch("/api/submissions", { method: "POST", body: fd });
    if (res.ok) {
      clearFormDraft(slug);
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
      <div
        className="p-8 text-center form-card form-success-card animate-tl-scale-in"
        style={{
          borderColor: `${theme.accent}44`,
          boxShadow: `0 20px 50px -20px ${theme.primary}33`,
        }}
      >
        <div
          className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-2xl"
          style={{
            background: `linear-gradient(135deg, ${theme.accent}, ${theme.primary})`,
            boxShadow: `0 8px 24px -6px ${theme.primary}55`,
          }}
        >
          <CheckCircle2 className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-xl font-bold form-title">¡Solicitud enviada!</h2>
        <p className="mt-2 text-sm form-muted max-w-sm mx-auto leading-relaxed">
          {tenantName} recibirá tu información. Mantente pendiente: serás contactado para una
          entrevista presencial. Gracias por aplicar.
        </p>
      </div>
    );
  }

  const FieldIcon = (key: string) => {
    const Icon = iconForField(key);
    return (
      <span className="form-label-icon">
        <Icon className="w-3.5 h-3.5" />
      </span>
    );
  };

  const selectColumns = (fieldKey: string, count: number): 2 | 3 => {
    if (fieldKey === "oficio_profesion" || count > 4) return 2;
    if (count <= 3) return 2;
    return 3;
  };

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

      <div className="space-y-5">
        {current.fields.map((field) =>
          field.type === "location" ? (
            <RdLocationFields
              key={field.key}
              defaults={locationValues}
              onFocus={handleFocus}
              onChange={handleLocationChange}
            />
          ) : (
            <div key={field.key}>
              <div className="form-label-row">
                {FieldIcon(field.key)}
                <label className="form-label mb-0">
                  {field.label}
                  {field.required ? " *" : ""}
                </label>
              </div>

              {field.type === "textarea" ? (
                <textarea
                  name={field.key}
                  required={field.required}
                  rows={3}
                  placeholder={field.placeholder}
                  value={formValues[field.key] ?? ""}
                  onChange={(e) => setFieldValue(field.key, e.target.value)}
                  onFocus={handleFocus}
                  className="form-input resize-y min-h-[88px]"
                />
              ) : field.type === "select" ? (
                <FormSelectCards
                  fieldKey={field.key}
                  options={field.options ?? []}
                  value={formValues[field.key] ?? ""}
                  onChange={(v) => setFieldValue(field.key, v)}
                  onFocus={handleFocus}
                  theme={theme}
                  columns={selectColumns(field.key, field.options?.length ?? 0)}
                />
              ) : field.type === "multiselect" ? (
                <FormMultiSelectCards
                  fieldKey={field.key}
                  options={field.options ?? []}
                  values={multiValues[field.key] ?? []}
                  onToggle={(o) => toggleMulti(field.key, o)}
                  onFocus={handleFocus}
                  theme={theme}
                  columns={field.key === "rubros_laborales" ? 2 : 3}
                />
              ) : field.type === "file" ? (
                <>
                  <input
                    name={field.key}
                    type="file"
                    required={field.required && !fileValues[field.key]}
                    accept={field.accept}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        setFileValues((prev) => ({ ...prev, [field.key]: f }));
                        setFileMeta((prev) => ({
                          ...prev,
                          [field.key]: { name: f.name, size: f.size },
                        }));
                      }
                    }}
                    onFocus={handleFocus}
                    className="form-input file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-black/10 file:text-inherit"
                  />
                  {(fileValues[field.key] || fileMeta[field.key]) && (
                    <p className="mt-1.5 text-xs form-muted">
                      Archivo: {fileValues[field.key]?.name ?? fileMeta[field.key]?.name}
                      {!fileValues[field.key] && fileMeta[field.key] && " — vuelve a seleccionarlo"}
                    </p>
                  )}
                </>
              ) : maskForField(field.key) ? (
                <FormMaskedInput
                  fieldKey={field.key}
                  value={formValues[field.key] ?? ""}
                  onChange={(v) => setFieldValue(field.key, v)}
                  onFocus={handleFocus}
                  required={field.required}
                  type={field.type}
                />
              ) : (
                <input
                  name={field.key}
                  type={field.type === "url" ? "url" : field.type}
                  required={field.required}
                  placeholder={field.placeholder}
                  value={formValues[field.key] ?? ""}
                  onChange={(e) => setFieldValue(field.key, e.target.value)}
                  onFocus={handleFocus}
                  className="form-input"
                />
              )}
            </div>
          ),
        )}
      </div>

      {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

      <div className="flex gap-3 mt-8">
        {step > 0 && (
          <button type="button" onClick={goBack} className="form-btn-ghost flex-1">
            <ChevronLeft className="w-4 h-4" />
            Atrás
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="form-btn-primary flex-1"
          style={{
            background: `linear-gradient(135deg, ${theme.accent}, ${theme.primary})`,
            boxShadow: `0 8px 28px -6px ${theme.primary}66`,
          }}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isLast ? (
            <>
              <Send className="w-4 h-4" />
              Enviar solicitud
            </>
          ) : (
            <>
              Siguiente
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
