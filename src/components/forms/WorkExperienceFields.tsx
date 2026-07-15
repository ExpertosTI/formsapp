"use client";

import { useEffect, useRef, useState } from "react";
import { Briefcase, Building2, Clock, Plus, Trash2 } from "lucide-react";
import {
  emptyWorkEntry,
  formatWorkDuration,
  parseWorkExperience,
  serializeWorkExperience,
  type WorkExperienceEntry,
} from "@/lib/work-experience";

interface Props {
  value: string;
  onChange: (serialized: string) => void;
  onFocus?: () => void;
  theme: { primary: string; accent: string };
}

export function WorkExperienceFields({ value, onChange, onFocus, theme }: Props) {
  const lastEmitted = useRef(value);
  const [entries, setEntries] = useState<WorkExperienceEntry[]>(() => parseWorkExperience(value));

  useEffect(() => {
    if (value === lastEmitted.current) return;
    lastEmitted.current = value;
    setEntries(parseWorkExperience(value));
  }, [value]);

  function commit(next: WorkExperienceEntry[]) {
    setEntries(next);
    const serialized = serializeWorkExperience(next);
    lastEmitted.current = serialized;
    onChange(serialized);
  }

  function update(id: string, patch: Partial<WorkExperienceEntry>) {
    commit(entries.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }

  function remove(id: string) {
    const next = entries.filter((e) => e.id !== id);
    commit(next.length ? next : [emptyWorkEntry()]);
  }

  function add() {
    commit([...entries, emptyWorkEntry()]);
  }

  return (
    <div className="space-y-4">
      {entries.map((entry, index) => (
        <article
          key={entry.id}
          className="p-3 sm:p-4 rounded-xl border border-black/10 dark:border-white/10 space-y-3"
          style={{ background: `${theme.primary}0d` }}
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-bold uppercase tracking-wider form-muted">
              Empleo {index + 1}
            </p>
            {entries.length > 1 && (
              <button
                type="button"
                onClick={() => remove(entry.id)}
                className="inline-flex items-center gap-1 text-xs text-red-500/90 hover:opacity-80"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Quitar
              </button>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="form-label-row mb-1.5">
                <span className="form-label-icon">
                  <Building2 className="w-3.5 h-3.5" />
                </span>
                <span className="form-label mb-0">Empresa *</span>
              </label>
              <input
                type="text"
                value={entry.empresa}
                onChange={(e) => update(entry.id, { empresa: e.target.value })}
                onFocus={onFocus}
                className="form-input"
                placeholder="Nombre de la empresa"
                autoComplete="organization"
              />
            </div>

            <div className="space-y-3">
              <div>
                <label className="form-label-row mb-1.5">
                  <span className="form-label-icon">
                    <Briefcase className="w-3.5 h-3.5" />
                  </span>
                  <span className="form-label mb-0">Puesto que desempeñó *</span>
                </label>
                <input
                  type="text"
                  value={entry.puesto}
                  onChange={(e) => update(entry.id, { puesto: e.target.value })}
                  onFocus={onFocus}
                  className="form-input"
                  placeholder="Ej. Cajero, Vendedor, Auxiliar…"
                  autoComplete="organization-title"
                />
              </div>

              <div>
                <label className="form-label-row mb-1.5">
                  <span className="form-label-icon">
                    <Clock className="w-3.5 h-3.5" />
                  </span>
                  <span className="form-label mb-0">Tiempo que laboró *</span>
                </label>

                <div className="flex gap-2 mb-2">
                  <ModeChip
                    active={entry.durationMode === "manual"}
                    label="Manual"
                    onClick={() => update(entry.id, { durationMode: "manual" })}
                    theme={theme}
                  />
                  <ModeChip
                    active={entry.durationMode === "periodo"}
                    label="Periodo"
                    onClick={() => update(entry.id, { durationMode: "periodo" })}
                    theme={theme}
                  />
                </div>

                {entry.durationMode === "manual" ? (
                  <input
                    type="text"
                    value={entry.tiempoManual}
                    onChange={(e) => update(entry.id, { tiempoManual: e.target.value })}
                    onFocus={onFocus}
                    className="form-input"
                    placeholder="Ej. 2 años, 8 meses…"
                  />
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="mb-1 text-[10px] form-muted">Desde</p>
                        <input
                          type="month"
                          value={entry.desde}
                          onChange={(e) => update(entry.id, { desde: e.target.value })}
                          onFocus={onFocus}
                          className="form-input"
                        />
                      </div>
                      <div>
                        <p className="mb-1 text-[10px] form-muted">Hasta</p>
                        <input
                          type="month"
                          value={entry.hasta}
                          disabled={entry.actual}
                          onChange={(e) => update(entry.id, { hasta: e.target.value, actual: false })}
                          onFocus={onFocus}
                          className="form-input disabled:opacity-50"
                        />
                      </div>
                    </div>
                    <label className="inline-flex items-center gap-2 text-xs form-muted cursor-pointer">
                      <input
                        type="checkbox"
                        checked={entry.actual}
                        onChange={(e) =>
                          update(entry.id, {
                            actual: e.target.checked,
                            hasta: e.target.checked ? "" : entry.hasta,
                          })
                        }
                        onFocus={onFocus}
                        className="rounded border-black/20"
                      />
                      Trabajo actual
                    </label>
                  </div>
                )}

                {formatWorkDuration(entry) && (
                  <p className="mt-1.5 text-[11px] form-muted">Duración: {formatWorkDuration(entry)}</p>
                )}
              </div>
            </div>
          </div>
        </article>
      ))}

      <button
        type="button"
        onClick={add}
        className="inline-flex items-center justify-center w-full gap-2 py-2.5 text-sm font-medium rounded-xl border border-dashed border-black/15 dark:border-white/15 form-muted hover:opacity-90 transition-opacity"
      >
        <Plus className="w-4 h-4" />
        Agregar otro empleo
      </button>
    </div>
  );
}

function ModeChip({
  active,
  label,
  onClick,
  theme,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  theme: { primary: string; accent: string };
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all"
      style={
        active
          ? {
              background: `linear-gradient(135deg, ${theme.accent}, ${theme.primary})`,
              color: "#fff",
            }
          : undefined
      }
    >
      <span className={active ? "" : "form-muted"}>{label}</span>
    </button>
  );
}
