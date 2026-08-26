"use client";

import { useState } from "react";
import {
  Briefcase,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  DollarSign,
  MapPin,
  Clock,
  RotateCcw,
} from "lucide-react";
import type { JobPosition, TenantSettings, WorkType } from "@/lib/form-config";
import { DEFAULT_JOB_POSITIONS } from "@/lib/form-config";

interface Props {
  settings: TenantSettings;
  onChange: (settings: TenantSettings) => void;
}

export function JobPositionsManager({ settings, onChange }: Props) {
  const [positions, setPositions] = useState<JobPosition[]>(
    settings.jobPositions && settings.jobPositions.length > 0
      ? settings.jobPositions
      : DEFAULT_JOB_POSITIONS
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Formulario temporal de puesto
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [salaryRange, setSalaryRange] = useState("");
  const [workType, setWorkType] = useState<WorkType>("full_time");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [featured, setFeatured] = useState(false);

  function savePositions(newPositions: JobPosition[]) {
    setPositions(newPositions);
    onChange({
      ...settings,
      jobPositions: newPositions,
    });
  }

  function handleToggleActive(id: string) {
    const updated = positions.map((p) => (p.id === id ? { ...p, active: !p.active } : p));
    savePositions(updated);
  }

  function handleDelete(id: string) {
    if (!confirm("¿Deseas eliminar este puesto de trabajo?")) return;
    const updated = positions.filter((p) => p.id !== id);
    savePositions(updated);
  }

  function startEdit(pos: JobPosition) {
    setEditingId(pos.id);
    setTitle(pos.title);
    setDepartment(pos.department ?? "");
    setSalaryRange(pos.salaryRange ?? "");
    setWorkType(pos.workType ?? "full_time");
    setLocation(pos.location ?? "");
    setDescription(pos.description ?? "");
    setRequirements(pos.requirements ?? "");
    setFeatured(pos.featured ?? false);
    setIsAdding(false);
  }

  function handleSaveEdit() {
    if (!title.trim()) return;

    if (isAdding) {
      const newPos: JobPosition = {
        id: `pos-${Date.now().toString(36)}`,
        title: title.trim(),
        department: department.trim() || undefined,
        salaryRange: salaryRange.trim() || undefined,
        workType,
        location: location.trim() || undefined,
        description: description.trim() || undefined,
        requirements: requirements.trim() || undefined,
        active: true,
        featured,
      };
      savePositions([...positions, newPos]);
    } else if (editingId) {
      const updated = positions.map((p) =>
        p.id === editingId
          ? {
              ...p,
              title: title.trim(),
              department: department.trim() || undefined,
              salaryRange: salaryRange.trim() || undefined,
              workType,
              location: location.trim() || undefined,
              description: description.trim() || undefined,
              requirements: requirements.trim() || undefined,
              featured,
            }
          : p
      );
      savePositions(updated);
    }

    cancelForm();
  }

  function cancelForm() {
    setEditingId(null);
    setIsAdding(false);
    setTitle("");
    setDepartment("");
    setSalaryRange("");
    setWorkType("full_time");
    setLocation("");
    setDescription("");
    setRequirements("");
    setFeatured(false);
  }

  function handleRestoreDefaults() {
    if (!confirm("¿Deseas restablecer los puestos a las plantillas predeterminadas?")) return;
    savePositions(DEFAULT_JOB_POSITIONS);
    cancelForm();
  }

  const workTypeLabels: Record<WorkType, string> = {
    full_time: "Tiempo completo",
    part_time: "Medio tiempo",
    remote: "Remoto / Híbrido",
    temporary: "Temporal / Por temporada",
    internship: "Pasantía / Prácticas",
  };

  return (
    <div className="space-y-6 animate-tl-fade-in">
      {/* ENCABEZADO DE SECCIÓN */}
      <section className="p-5 sm:p-6 tl-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Vacantes y Puestos Abiertos</h2>
              <p className="text-xs text-slate-400">
                Publica los puestos disponibles en tu empresa para que los candidatos postulen específicamente.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRestoreDefaults}
              className="tl-btn-ghost text-xs py-1.5 px-3"
              title="Restablecer puestos sugeridos"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restablecer
            </button>

            {!isAdding && !editingId && (
              <button
                type="button"
                onClick={() => {
                  cancelForm();
                  setIsAdding(true);
                }}
                className="tl-btn-primary text-xs py-1.5 px-3"
              >
                <Plus className="w-3.5 h-3.5" />
                Nuevo Puesto
              </button>
            )}
          </div>
        </div>

        {/* FORMULARIO CREAR / EDITAR PUESTO */}
        {(isAdding || editingId) && (
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-teal-500/30 space-y-4 animate-tl-scale-in">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h3 className="text-xs font-bold text-teal-300 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" />
                {isAdding ? "Publicar Nuevo Puesto" : "Editar Puesto de Trabajo"}
              </h3>
              <button type="button" onClick={cancelForm} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="tl-label">Título de la Vacante *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej. Cajero/a Principal, Chofer de Ruta, Vendedor/a"
                  className="tl-input text-xs"
                  required
                />
              </div>

              <div>
                <label className="tl-label">Departamento / Área</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Ej. Ventas, Administración, Caja"
                  className="tl-input text-xs"
                />
              </div>

              <div>
                <label className="tl-label">Tipo de Jornada</label>
                <select
                  value={workType}
                  onChange={(e) => setWorkType(e.target.value as WorkType)}
                  className="tl-input text-xs"
                >
                  <option value="full_time">Tiempo completo</option>
                  <option value="part_time">Medio tiempo</option>
                  <option value="remote">Remoto / Híbrido</option>
                  <option value="temporary">Temporal / Temporada</option>
                  <option value="internship">Pasantía</option>
                </select>
              </div>

              <div>
                <label className="tl-label">Rango Salarial (Opcional)</label>
                <input
                  type="text"
                  value={salaryRange}
                  onChange={(e) => setSalaryRange(e.target.value)}
                  placeholder="Ej. RD$25,000 - RD$35,000 / mes"
                  className="tl-input text-xs"
                />
              </div>

              <div>
                <label className="tl-label">Ubicación / Sucursal</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ej. Sede Central, Santiago, Distrito Nacional"
                  className="tl-input text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="tl-label">Descripción breve del puesto</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="¿Cuáles serán las responsabilidades principales?"
                  className="tl-input text-xs resize-y"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="tl-label">Requisitos específicos</label>
                <textarea
                  rows={2}
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  placeholder="Ej. Manejo de sistemas POS, licencia al día, actitud positiva..."
                  className="tl-input text-xs resize-y"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="rounded border-white/10 bg-slate-900 text-teal-500"
                  />
                  <span>Destacar puesto como urgente / prioritario</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <button type="button" onClick={cancelForm} className="tl-btn-ghost text-xs">
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={!title.trim()}
                className="tl-btn-primary text-xs"
              >
                <Check className="w-3.5 h-3.5" />
                {isAdding ? "Guardar Vacante" : "Actualizar Vacante"}
              </button>
            </div>
          </div>
        )}

        {/* LISTA DE VACANTES PUBLICADAS */}
        <div className="space-y-3">
          {positions.map((pos) => (
            <div
              key={pos.id}
              className={`p-4 rounded-2xl border transition-all ${
                pos.active
                  ? "bg-white/[0.02] border-white/10 hover:border-teal-500/30"
                  : "bg-white/[0.01] border-white/5 opacity-60"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-white truncate">{pos.title}</h3>
                    {pos.featured && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        ⭐ Destacado
                      </span>
                    )}
                    {pos.department && (
                      <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-white/5 text-slate-400 border border-white/10">
                        {pos.department}
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                        pos.active
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                      }`}
                    >
                      {pos.active ? "Abierta" : "Pausada"}
                    </span>
                  </div>

                  {pos.description && (
                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                      {pos.description}
                    </p>
                  )}

                  {pos.requirements && (
                    <p className="text-[11px] text-slate-400 italic line-clamp-1">
                      <strong>Requisitos:</strong> {pos.requirements}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400">
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

                {/* BOTONES DE ACCIÓN */}
                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-start">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(pos.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 text-xs"
                    title={pos.active ? "Pausar vacante" : "Activar vacante"}
                  >
                    {pos.active ? (
                      <ToggleRight className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <ToggleLeft className="w-5 h-5 text-slate-500" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => startEdit(pos)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-teal-300 hover:bg-teal-500/10 border border-transparent hover:border-teal-500/20 text-xs"
                    title="Editar puesto"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(pos.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 text-xs"
                    title="Eliminar puesto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {positions.length === 0 && (
            <div className="p-8 text-center rounded-2xl bg-white/[0.02] border border-white/10 text-slate-400 text-xs">
              No tienes puestos creados actualmente. Pulsa <strong>"Nuevo Puesto"</strong> para publicar una vacante.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
