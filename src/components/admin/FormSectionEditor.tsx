"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  X,
  RotateCcw,
  Check,
  Briefcase,
  DollarSign,
  Award,
  MessageSquare,
  User,
  Phone,
  MapPin,
  FileText,
  HelpCircle,
  Trash2,
  ListPlus,
  Sparkles,
} from "lucide-react";
import {
  AREA_OPTS,
  MODALIDAD_COMPENSACION_OPTS,
  DISPOSICION_CAPACITACION_OPTS,
  RUBROS_LABORALES,
  STEP_TITLES,
  type CustomQuestion,
  type FormType,
  type TenantSettings,
} from "@/lib/form-config";
import { PROFESIONES, DISPONIBILIDAD } from "@/lib/form-options";

interface Props {
  settings: TenantSettings;
  onChange: (updatedSettings: TenantSettings) => void;
}

export function FormSectionEditor({ settings, onChange }: Props) {
  const formType = settings.formType ?? "simple";
  const sections = settings.sections ?? {};
  const fields = settings.fields ?? {};
  const customLabels = settings.customLabels ?? {};
  const customPlaceholders = settings.customPlaceholders ?? {};
  const customOptions = settings.customOptions ?? {};
  const customQuestions = settings.customQuestions ?? [];

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    area_aplicar: true,
    custom_questions: true,
  });

  const [newQuestionOpen, setNewQuestionOpen] = useState(false);
  const [newQTitle, setNewQTitle] = useState("");
  const [newQLabel, setNewQLabel] = useState("");
  const [newQType, setNewQType] = useState<"text" | "textarea" | "select" | "yes_no">("text");
  const [newQRequired, setNewQRequired] = useState(true);
  const [newQPlaceholder, setNewQPlaceholder] = useState("");
  const [newQOptions, setNewQOptions] = useState<string[]>(["Opción 1", "Opción 2"]);
  const [newQOptionInput, setNewQOptionInput] = useState("");

  function toggleExpand(key: string) {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function setSectionActive(key: string, active: boolean) {
    const nextSections = { ...sections, [key]: active };
    onChange({ ...settings, sections: nextSections });
  }

  function setFieldActive(key: string, active: boolean) {
    const nextFields = { ...fields, [key]: active };
    onChange({ ...settings, fields: nextFields });
  }

  function setCustomLabel(key: string, value: string) {
    const nextLabels = { ...customLabels, [key]: value };
    onChange({ ...settings, customLabels: nextLabels });
  }

  function setCustomPlaceholder(key: string, value: string) {
    const nextPlaceholders = { ...customPlaceholders, [key]: value };
    onChange({ ...settings, customPlaceholders: nextPlaceholders });
  }

  function setCustomOptionList(key: string, options: string[]) {
    const nextOptions = { ...customOptions, [key]: options };
    onChange({ ...settings, customOptions: nextOptions });
  }

  function handleAddCustomQuestion() {
    if (!newQLabel.trim()) {
      alert("Por favor escribe el enunciado de la pregunta");
      return;
    }
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const question: CustomQuestion = {
      id,
      title: newQTitle.trim() || newQLabel.trim(),
      label: newQLabel.trim(),
      type: newQType,
      required: newQRequired,
      placeholder: newQPlaceholder.trim() || undefined,
      options: newQType === "select" ? newQOptions : undefined,
    };

    const nextCustomQuestions = [...customQuestions, question];
    onChange({ ...settings, customQuestions: nextCustomQuestions });

    // Reset modal fields
    setNewQTitle("");
    setNewQLabel("");
    setNewQType("text");
    setNewQRequired(true);
    setNewQPlaceholder("");
    setNewQOptions(["Opción 1", "Opción 2"]);
    setNewQuestionOpen(false);
  }

  function handleDeleteCustomQuestion(id: string) {
    const nextCustomQuestions = customQuestions.filter((q) => q.id !== id);
    onChange({ ...settings, customQuestions: nextCustomQuestions });
  }

  return (
    <div className="space-y-6">
      {/* Selector de Tipo de Formulario */}
      <section className="p-5 sm:p-6 tl-card space-y-4">
        <h2 className="text-sm font-semibold text-white">Modalidad de Formulario</h2>
        <p className="text-xs text-slate-400">
          Selecciona el estilo general. Puedes activar, desactivar o personalizar cualquier sección individual debajo.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onChange({ ...settings, formType: "simple" })}
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
              Formulario rápido: Selección de vacante, datos personales esenciales, ubicación y CV.
            </p>
          </button>

          <button
            type="button"
            onClick={() => onChange({ ...settings, formType: "full" })}
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
              Multipaso exhaustivo: incluye historial laboral previo, formación académica y datos adicionales.
            </p>
          </button>
        </div>
      </section>

      {/* SECCIÓN 1: PUESTO / ÁREA A APLICAR */}
      <CollapsibleSectionCard
        title="1. Área o Puesto a Aplicar"
        description="Define las vacantes que verán los postulantes en la primera pantalla."
        icon={Briefcase}
        active={sections.area_aplicar !== false}
        onToggleActive={(v) => setSectionActive("area_aplicar", v)}
        expanded={expandedSections.area_aplicar}
        onToggleExpand={() => toggleExpand("area_aplicar")}
      >
        <div className="space-y-4 pt-2">
          <div>
            <label className="tl-label">Título del paso</label>
            <input
              type="text"
              value={customLabels.area_aplicar_title ?? STEP_TITLES.area_aplicar}
              onChange={(e) => setCustomLabel("area_aplicar_title", e.target.value)}
              placeholder="Área a la que deseas aplicar"
              className="tl-input"
            />
          </div>

          <div>
            <label className="tl-label">Enunciado de la pregunta</label>
            <input
              type="text"
              value={customLabels.area_aplicar ?? "Deseas aplicar para qué área:"}
              onChange={(e) => setCustomLabel("area_aplicar", e.target.value)}
              placeholder="Deseas aplicar para qué área:"
              className="tl-input"
            />
          </div>

          <div>
            <label className="tl-label">Opciones de Puestos / Vacantes disponibles</label>
            <OptionsChipEditor
              options={customOptions.area_aplicar ?? AREA_OPTS}
              defaultOptions={AREA_OPTS}
              onChange={(opts) => setCustomOptionList("area_aplicar", opts)}
              placeholder="Ej. Cajero/a, Chofer, Asistente..."
            />
          </div>
        </div>
      </CollapsibleSectionCard>

      {/* SECCIÓN 2: MODALIDAD DE COMPENSACIÓN */}
      <CollapsibleSectionCard
        title="2. Modalidad de Compensación"
        description="Pregunta sobre preferencia de sueldo fijo, comisiones o mixto."
        icon={DollarSign}
        active={sections.modalidad_compensacion !== false}
        onToggleActive={(v) => setSectionActive("modalidad_compensacion", v)}
        expanded={expandedSections.modalidad_compensacion}
        onToggleExpand={() => toggleExpand("modalidad_compensacion")}
      >
        <div className="space-y-4 pt-2">
          <div>
            <label className="tl-label">Título del paso</label>
            <input
              type="text"
              value={customLabels.modalidad_compensacion_title ?? STEP_TITLES.modalidad_compensacion}
              onChange={(e) => setCustomLabel("modalidad_compensacion_title", e.target.value)}
              className="tl-input"
            />
          </div>

          <div>
            <label className="tl-label">Enunciado de la pregunta</label>
            <input
              type="text"
              value={customLabels.modalidad_compensacion ?? "¿Qué modalidad de compensación prefieres?"}
              onChange={(e) => setCustomLabel("modalidad_compensacion", e.target.value)}
              className="tl-input"
            />
          </div>

          <div>
            <label className="tl-label">Opciones de compensación</label>
            <OptionsChipEditor
              options={customOptions.modalidad_compensacion ?? MODALIDAD_COMPENSACION_OPTS}
              defaultOptions={MODALIDAD_COMPENSACION_OPTS}
              onChange={(opts) => setCustomOptionList("modalidad_compensacion", opts)}
              placeholder="Nueva opción de compensación…"
            />
          </div>
        </div>
      </CollapsibleSectionCard>

      {/* SECCIÓN 3: CAPACITACIÓN Y TRABAJO POR METAS */}
      <CollapsibleSectionCard
        title="3. Capacitación y Trabajo por Metas"
        description="Evalúa la disposición a capacitarse y cumplir metas por resultados."
        icon={Award}
        active={sections.disposicion_capacitacion !== false}
        onToggleActive={(v) => setSectionActive("disposicion_capacitacion", v)}
        expanded={expandedSections.disposicion_capacitacion}
        onToggleExpand={() => toggleExpand("disposicion_capacitacion")}
      >
        <div className="space-y-4 pt-2">
          <div>
            <label className="tl-label">Título del paso</label>
            <input
              type="text"
              value={customLabels.disposicion_capacitacion_title ?? STEP_TITLES.disposicion_capacitacion}
              onChange={(e) => setCustomLabel("disposicion_capacitacion_title", e.target.value)}
              className="tl-input"
            />
          </div>

          <div>
            <label className="tl-label">Enunciado de la pregunta</label>
            <textarea
              rows={2}
              value={
                customLabels.disposicion_capacitacion ??
                "¿Estás dispuesto/a a capacitarte, cumplir metas y trabajar bajo resultados?"
              }
              onChange={(e) => setCustomLabel("disposicion_capacitacion", e.target.value)}
              className="tl-input resize-y"
            />
          </div>

          <div>
            <label className="tl-label">Opciones de respuesta</label>
            <OptionsChipEditor
              options={customOptions.disposicion_capacitacion ?? DISPOSICION_CAPACITACION_OPTS}
              defaultOptions={DISPOSICION_CAPACITACION_OPTS}
              onChange={(opts) => setCustomOptionList("disposicion_capacitacion", opts)}
              placeholder="Nueva opción…"
            />
          </div>
        </div>
      </CollapsibleSectionCard>

      {/* SECCIÓN 4: APORTE A LA EMPRESA */}
      <CollapsibleSectionCard
        title="4. Tu Aporte y Compromiso"
        description="Pregunta abierta sobre el compromiso y metas del postulante."
        icon={MessageSquare}
        active={sections.aporte_empresa !== false}
        onToggleActive={(v) => setSectionActive("aporte_empresa", v)}
        expanded={expandedSections.aporte_empresa}
        onToggleExpand={() => toggleExpand("aporte_empresa")}
      >
        <div className="space-y-4 pt-2">
          <div>
            <label className="tl-label">Título del paso</label>
            <input
              type="text"
              value={customLabels.aporte_empresa_title ?? STEP_TITLES.aporte_empresa}
              onChange={(e) => setCustomLabel("aporte_empresa_title", e.target.value)}
              className="tl-input"
            />
          </div>

          <div>
            <label className="tl-label">Enunciado de la pregunta</label>
            <textarea
              rows={3}
              value={
                customLabels.aporte_empresa ??
                "Si te diéramos la oportunidad de formar parte de nuestra empresa, ¿qué estarías dispuesto/a a aportar para crecer, alcanzar tus metas y contribuir al éxito del equipo?"
              }
              onChange={(e) => setCustomLabel("aporte_empresa", e.target.value)}
              className="tl-input resize-y"
            />
          </div>

          <div>
            <label className="tl-label">Texto de sugerencia (Placeholder)</label>
            <input
              type="text"
              value={customPlaceholders.aporte_empresa ?? "Escribe tu respuesta aquí..."}
              onChange={(e) => setCustomPlaceholder("aporte_empresa", e.target.value)}
              className="tl-input"
            />
          </div>
        </div>
      </CollapsibleSectionCard>

      {/* SECCIÓN 5: DATOS PERSONALES */}
      <CollapsibleSectionCard
        title="5. Datos Personales"
        description="Nombre, cédula, fecha de nacimiento, estado civil y nacionalidad."
        icon={User}
        active={sections.datos_personales !== false}
        onToggleActive={(v) => setSectionActive("datos_personales", v)}
        expanded={expandedSections.datos_personales}
        onToggleExpand={() => toggleExpand("datos_personales")}
      >
        <div className="space-y-3 pt-2">
          <p className="text-xs font-semibold text-slate-300">Campos a solicitar:</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <ToggleOption
              label="Cédula de Identidad"
              checked={fields.cedula !== false}
              onChange={(v) => setFieldActive("cedula", v)}
            />
            <ToggleOption
              label="Fecha de nacimiento"
              checked={fields.fecha_nacimiento !== false}
              onChange={(v) => setFieldActive("fecha_nacimiento", v)}
            />
            <ToggleOption
              label="Lugar de nacimiento"
              checked={fields.lugar_nacimiento !== false}
              onChange={(v) => setFieldActive("lugar_nacimiento", v)}
            />
            <ToggleOption
              label="Nacionalidad"
              checked={fields.nacionalidad !== false}
              onChange={(v) => setFieldActive("nacionalidad", v)}
            />
            <ToggleOption
              label="Sexo / Género"
              checked={fields.sexo !== false}
              onChange={(v) => setFieldActive("sexo", v)}
            />
            <ToggleOption
              label="Estado civil"
              checked={fields.estado_civil !== false}
              onChange={(v) => setFieldActive("estado_civil", v)}
            />
          </div>
        </div>
      </CollapsibleSectionCard>

      {/* SECCIÓN 6: CONTACTO */}
      <CollapsibleSectionCard
        title="6. Contacto"
        description="Celular, correo electrónico y teléfono residencial."
        icon={Phone}
        active={sections.contacto !== false}
        onToggleActive={(v) => setSectionActive("contacto", v)}
        expanded={expandedSections.contacto}
        onToggleExpand={() => toggleExpand("contacto")}
      >
        <div className="space-y-3 pt-2">
          <div className="grid gap-2 sm:grid-cols-2">
            <ToggleOption
              label="Celular móvil (Requerido)"
              checked={true}
              disabled={true}
              onChange={() => {}}
            />
            <ToggleOption
              label="Correo electrónico (Requerido)"
              checked={true}
              disabled={true}
              onChange={() => {}}
            />
            <ToggleOption
              label="Teléfono residencial / casa"
              checked={fields.tel_casa !== false}
              onChange={(v) => setFieldActive("tel_casa", v)}
            />
          </div>
        </div>
      </CollapsibleSectionCard>

      {/* SECCIÓN 7: UBICACIÓN */}
      <CollapsibleSectionCard
        title="7. Ubicación y Dirección"
        description="Provincia, municipio/ciudad, sector y dirección del postulante."
        icon={MapPin}
        active={sections.ubicacion !== false}
        onToggleActive={(v) => setSectionActive("ubicacion", v)}
        expanded={expandedSections.ubicacion}
        onToggleExpand={() => toggleExpand("ubicacion")}
      >
        <div className="pt-2 text-xs text-slate-400">
          Incluye selector jerárquico dominicano de Provincias, Municipios y Sectores.
        </div>
      </CollapsibleSectionCard>

      {/* SECCIÓN 8: PERFIL PROFESIONAL */}
      <CollapsibleSectionCard
        title="8. Perfil Profesional y Rubros"
        description="Oficio/profesión, sueldo aspirado, rubros laborales y habilidades."
        icon={Briefcase}
        active={sections.perfil_profesional !== false}
        onToggleActive={(v) => setSectionActive("perfil_profesional", v)}
        expanded={expandedSections.perfil_profesional}
        onToggleExpand={() => toggleExpand("perfil_profesional")}
      >
        <div className="space-y-4 pt-2">
          <div className="grid gap-2 sm:grid-cols-2">
            <ToggleOption
              label="Oficio / Profesión principal"
              checked={fields.oficio_profesion !== false}
              onChange={(v) => setFieldActive("oficio_profesion", v)}
            />
            <ToggleOption
              label="Sueldo aspirado (RD$)"
              checked={fields.sueldo_aspirado !== false}
              onChange={(v) => setFieldActive("sueldo_aspirado", v)}
            />
            <ToggleOption
              label="Rubros laborales trabajados"
              checked={fields.rubros_laborales !== false}
              onChange={(v) => setFieldActive("rubros_laborales", v)}
            />
            <ToggleOption
              label="Habilidades adicionales"
              checked={fields.habilidades !== false}
              onChange={(v) => setFieldActive("habilidades", v)}
            />
            <ToggleOption
              label="Red profesional (LinkedIn / Portafolio)"
              checked={fields.red_profesional === true}
              onChange={(v) => setFieldActive("red_profesional", v)}
            />
          </div>

          <div>
            <label className="tl-label">Lista de Oficios / Profesiones disponibles</label>
            <OptionsChipEditor
              options={customOptions.oficio_profesion ?? PROFESIONES}
              defaultOptions={PROFESIONES}
              onChange={(opts) => setCustomOptionList("oficio_profesion", opts)}
              placeholder="Nueva profesión…"
            />
          </div>
        </div>
      </CollapsibleSectionCard>

      {/* SECCIÓN 9: EXPERIENCIA LABORAL */}
      <CollapsibleSectionCard
        title="9. Experiencia Laboral Previa"
        description="Historial de empresas previas, tiempo laborado, motivos de salida y disponibilidad."
        icon={Briefcase}
        active={sections.experiencia_laboral !== false}
        onToggleActive={(v) => setSectionActive("experiencia_laboral", v)}
        expanded={expandedSections.experiencia_laboral}
        onToggleExpand={() => toggleExpand("experiencia_laboral")}
      >
        <div className="space-y-4 pt-2">
          <div>
            <label className="tl-label">Opciones de Disponibilidad para empezar</label>
            <OptionsChipEditor
              options={customOptions.tiempo_disponible ?? DISPONIBILIDAD}
              defaultOptions={DISPONIBILIDAD}
              onChange={(opts) => setCustomOptionList("tiempo_disponible", opts)}
              placeholder="Ej. Inmediato, 1 semana…"
            />
          </div>
        </div>
      </CollapsibleSectionCard>

      {/* SECCIÓN 10: FORMACIÓN ACADÉMICA */}
      <CollapsibleSectionCard
        title="10. Formación Académica"
        description="Nivel escolar, estudios universitarios, especialidades y días de clases."
        icon={Award}
        active={sections.preparacion_academica !== false}
        onToggleActive={(v) => setSectionActive("preparacion_academica", v)}
        expanded={expandedSections.preparacion_academica}
        onToggleExpand={() => toggleExpand("preparacion_academica")}
      >
        <div className="pt-2 text-xs text-slate-400">
          Solicita nivel de educación primaria, secundaria, universidad y si estudia actualmente.
        </div>
      </CollapsibleSectionCard>

      {/* SECCIÓN 11: REFERENCIAS */}
      <CollapsibleSectionCard
        title="11. Referencias Familiares"
        description="Datos de familiares y conocidos recomendados."
        icon={User}
        active={sections.datos_familiares === true}
        onToggleActive={(v) => setSectionActive("datos_familiares", v)}
        expanded={expandedSections.datos_familiares}
        onToggleExpand={() => toggleExpand("datos_familiares")}
      >
        <div className="pt-2 text-xs text-slate-400">
          Pregunta sobre familiares en la empresa, nombres de parientes y recomendados.
        </div>
      </CollapsibleSectionCard>

      {/* SECCIÓN 12: DOCUMENTOS (CV Y FOTO) */}
      <CollapsibleSectionCard
        title="12. Documentos y Archivos"
        description="Subida de Curriculum Vitae (PDF/DOC) y Foto reciente."
        icon={FileText}
        active={sections.documentos !== false}
        onToggleActive={(v) => setSectionActive("documentos", v)}
        expanded={expandedSections.documentos}
        onToggleExpand={() => toggleExpand("documentos")}
      >
        <div className="space-y-3 pt-2">
          <div className="grid gap-2 sm:grid-cols-2">
            <ToggleOption
              label="Curriculum Vitae (PDF/Word)"
              checked={fields.curriculum !== false}
              onChange={(v) => setFieldActive("curriculum", v)}
            />
            <ToggleOption
              label="Foto reciente del postulante"
              checked={fields.foto !== false}
              onChange={(v) => setFieldActive("foto", v)}
            />
          </div>
        </div>
      </CollapsibleSectionCard>

      {/* SECCIÓN 13: INFORMACIÓN ADICIONAL */}
      <CollapsibleSectionCard
        title="13. Información Adicional"
        description="Licencia de conducir, vehículo propio, condiciones de salud y deportes."
        icon={HelpCircle}
        active={sections.informacion_adicional !== false}
        onToggleActive={(v) => setSectionActive("informacion_adicional", v)}
        expanded={expandedSections.informacion_adicional}
        onToggleExpand={() => toggleExpand("informacion_adicional")}
      >
        <div className="pt-2 text-xs text-slate-400">
          Preguntas sobre transporte y salud para validar idoneidad operativa del puesto.
        </div>
      </CollapsibleSectionCard>

      {/* SECCIÓN 14: PREGUNTAS PERSONALIZADAS */}
      <div className="p-5 sm:p-6 tl-card space-y-4 border-teal-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-400" />
            <h3 className="text-sm font-semibold text-white">Preguntas Personalizadas de tu Empresa</h3>
          </div>
          <button
            type="button"
            onClick={() => setNewQuestionOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-teal-500/10 text-teal-300 border border-teal-500/20 hover:bg-teal-500/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Agregar pregunta
          </button>
        </div>
        <p className="text-xs text-slate-400">
          Crea preguntas a la medida de tu negocio (ej. "¿Tiene disponibilidad para viajar?", "¿Cuál es su nivel de inglés?").
        </p>

        {customQuestions.length > 0 ? (
          <div className="space-y-2.5 pt-2">
            {customQuestions.map((q, idx) => (
              <div
                key={q.id}
                className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all"
              >
                <div className="min-w-0 flex-1 pr-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-white truncate">
                      {idx + 1}. {q.title || q.label}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 uppercase font-semibold">
                      {q.type === "textarea"
                        ? "Texto largo"
                        : q.type === "select"
                        ? "Selección"
                        : q.type === "yes_no"
                        ? "Sí / No"
                        : "Texto corto"}
                    </span>
                    {q.required && (
                      <span className="text-[10px] text-teal-400 font-bold">* Obligatoria</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 truncate">{q.label}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteCustomQuestion(q.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-300 hover:bg-red-500/10 transition-all"
                  title="Eliminar pregunta"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center rounded-xl bg-white/[0.01] border border-dashed border-white/10 text-xs text-slate-500">
            No has agregado preguntas personalizadas aún.
          </div>
        )}

        {/* Modal / Formulario para nueva pregunta personalizada */}
        {newQuestionOpen && (
          <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.04] border border-teal-500/30 space-y-4 animate-tl-scale-in">
            <h4 className="text-xs font-bold uppercase tracking-wider text-teal-400">
              Nueva Pregunta Personalizada
            </h4>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="tl-label">Título del paso (Encabezado)</label>
                <input
                  type="text"
                  value={newQTitle}
                  onChange={(e) => setNewQTitle(e.target.value)}
                  placeholder="Ej. Disponibilidad de Viaje"
                  className="tl-input"
                />
              </div>

              <div>
                <label className="tl-label">Tipo de respuesta</label>
                <select
                  value={newQType}
                  onChange={(e) => setNewQType(e.target.value as any)}
                  className="tl-input"
                >
                  <option value="text">Texto corto (1 línea)</option>
                  <option value="textarea">Texto largo (Párrafo)</option>
                  <option value="select">Selección con opciones</option>
                  <option value="yes_no">Sí / No</option>
                </select>
              </div>
            </div>

            <div>
              <label className="tl-label">Enunciado de la pregunta *</label>
              <input
                type="text"
                value={newQLabel}
                onChange={(e) => setNewQLabel(e.target.value)}
                placeholder="Ej. ¿Posee disponibilidad para viajar al interior del país?"
                className="tl-input"
                required
              />
            </div>

            {newQType === "select" && (
              <div>
                <label className="tl-label">Opciones para seleccionar</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {newQOptions.map((opt, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-teal-500/10 text-teal-200 border border-teal-500/20"
                    >
                      {opt}
                      <button
                        type="button"
                        onClick={() => setNewQOptions(newQOptions.filter((_, idx) => idx !== i))}
                        className="hover:text-red-300"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newQOptionInput}
                    onChange={(e) => setNewQOptionInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newQOptionInput.trim()) {
                        e.preventDefault();
                        setNewQOptions([...newQOptions, newQOptionInput.trim()]);
                        setNewQOptionInput("");
                      }
                    }}
                    placeholder="Escribe una opción y presiona Enter..."
                    className="tl-input flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newQOptionInput.trim()) {
                        setNewQOptions([...newQOptions, newQOptionInput.trim()]);
                        setNewQOptionInput("");
                      }
                    }}
                    className="tl-btn-ghost text-xs shrink-0"
                  >
                    <Plus className="w-3 h-3" /> Agregar
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newQRequired}
                  onChange={(e) => setNewQRequired(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-teal-500"
                />
                Respuesta obligatoria
              </label>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setNewQuestionOpen(false)}
                className="tl-btn-ghost text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAddCustomQuestion}
                className="tl-btn-primary text-xs"
              >
                Guardar pregunta
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CollapsibleSectionCard({
  title,
  description,
  icon: Icon,
  active,
  onToggleActive,
  expanded,
  onToggleExpand,
  children,
}: {
  title: string;
  description: string;
  icon: any;
  active: boolean;
  onToggleActive: (active: boolean) => void;
  expanded?: boolean;
  onToggleExpand: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border transition-all ${
        active
          ? "border-white/10 bg-slate-900/60"
          : "border-white/5 bg-white/[0.01] opacity-70"
      }`}
    >
      <div className="p-4 sm:p-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            className={`flex items-center justify-center w-9 h-9 rounded-xl shrink-0 ${
              active
                ? "bg-teal-500/10 text-teal-400 border border-teal-500/20"
                : "bg-slate-500/10 text-slate-500 border border-white/5"
            }`}
          >
            <Icon className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-white truncate">{title}</h3>
            <p className="text-xs text-slate-400 truncate">{description}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => onToggleActive(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-10 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-500"></div>
          </label>

          <button
            type="button"
            onClick={onToggleExpand}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
            title={expanded ? "Colapsar" : "Expandir para editar"}
          >
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {expanded && active && (
        <div className="px-4 pb-5 sm:px-5 border-t border-white/5 space-y-4 animate-tl-fade-in">
          {children}
        </div>
      )}
    </div>
  );
}

function ToggleOption({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all ${
        disabled
          ? "border-white/5 bg-white/[0.01] opacity-60 cursor-not-allowed"
          : checked
          ? "border-teal-500/20 bg-teal-500/5 text-slate-200 cursor-pointer"
          : "border-white/5 bg-white/[0.02] text-slate-400 cursor-pointer hover:border-white/10"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-white/20 bg-white/5 text-teal-500 focus:ring-teal-400"
      />
      <span className="text-xs font-medium">{label}</span>
    </label>
  );
}

function OptionsChipEditor({
  options,
  defaultOptions,
  onChange,
  placeholder,
}: {
  options: string[];
  defaultOptions: string[];
  onChange: (options: string[]) => void;
  placeholder?: string;
}) {
  const [inputVal, setInputVal] = useState("");

  function addOption() {
    const val = inputVal.trim();
    if (!val) return;
    if (options.includes(val)) {
      setInputVal("");
      return;
    }
    onChange([...options, val]);
    setInputVal("");
  }

  function removeOption(index: number) {
    onChange(options.filter((_, i) => i !== index));
  }

  function restoreDefaults() {
    if (confirm("¿Restablecer las opciones originales predeterminadas?")) {
      onChange(defaultOptions);
    }
  }

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-2 rounded-xl bg-black/20 border border-white/5">
        {options.map((opt, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-teal-500/10 text-teal-200 border border-teal-500/20 group"
          >
            {opt}
            <button
              type="button"
              onClick={() => removeOption(i)}
              className="p-0.5 rounded text-teal-400/60 hover:text-red-300 hover:bg-red-500/20 transition-all"
              title="Eliminar opción"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addOption();
            }
          }}
          placeholder={placeholder || "Escribe y presiona Enter..."}
          className="tl-input flex-1 text-xs"
        />
        <button
          type="button"
          onClick={addOption}
          className="tl-btn-ghost text-xs shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          Agregar
        </button>
        <button
          type="button"
          onClick={restoreDefaults}
          className="tl-btn-ghost text-xs shrink-0 text-slate-400 hover:text-white"
          title="Restablecer opciones predeterminadas"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
