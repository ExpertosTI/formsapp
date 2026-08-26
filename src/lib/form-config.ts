import { PROFESIONES, DIAS_SEMANA, DISPONIBILIDAD } from "./form-options";

export type FormFieldType =
  | "text"
  | "email"
  | "tel"
  | "date"
  | "textarea"
  | "select"
  | "file"
  | "multiselect"
  | "url"
  | "location"
  | "work_experience";

export interface FormField {
  key: string;
  label: string;
  type: FormFieldType;
  required?: boolean;
  options?: string[];
  accept?: string;
  placeholder?: string;
}

export interface FormSection {
  id: string;
  title: string;
  fields: FormField[];
}

export type ThemeMode = "dark" | "light" | "system";
export type FormType = "simple" | "full" | "custom";
export type WorkType = "full_time" | "part_time" | "remote" | "temporary" | "internship";

export interface CustomQuestion {
  id: string;
  title: string;
  label: string;
  type: "text" | "textarea" | "select" | "yes_no";
  options?: string[];
  required?: boolean;
  placeholder?: string;
}

export interface JobPosition {
  id: string;
  title: string;
  department?: string;
  description?: string;
  requirements?: string;
  salaryRange?: string;
  workType?: WorkType;
  location?: string;
  active: boolean;
  featured?: boolean;
  customQuestions?: CustomQuestion[];
}

export interface TenantSettings {
  formType?: FormType;
  sections?: Record<string, boolean>;
  fields?: Record<string, boolean>;
  customLabels?: Record<string, string>;
  customPlaceholders?: Record<string, string>;
  customOptions?: Record<string, string[]>;
  customQuestions?: CustomQuestion[];
  jobPositions?: JobPosition[];
  themeMode?: ThemeMode;
  introText?: string;
  whatsappInstance?: string;
  whatsappToken?: string;
  notifyOnSubmission?: boolean;
  adminNotifyPhone?: string;
}

export const DEFAULT_JOB_POSITIONS: JobPosition[] = [
  {
    id: "pos-1",
    title: "Vendedor / Asesor Comercial",
    department: "Ventas",
    description: "Atención al cliente, asesoría personalizada y cierre de ventas.",
    requirements: "Excelente actitud, facilidad de palabra y vocación de servicio.",
    salaryRange: "RD$22,000 - RD$35,000 + comisiones",
    workType: "full_time",
    location: "Sede Principal",
    active: true,
    featured: true,
  },
  {
    id: "pos-2",
    title: "Cajero / Facturación",
    department: "Operaciones",
    description: "Cobros en caja, manejo de POS, cuadre de caja y facturación.",
    requirements: "Manejo de sistemas de caja, honestidad y responsabilidad.",
    salaryRange: "RD$20,000 - RD$26,000",
    workType: "full_time",
    location: "Sede Principal",
    active: true,
  },
  {
    id: "pos-3",
    title: "Gestor de Cobranza y Cuentas",
    department: "Finanzas",
    description: "Seguimiento a clientes, acuerdos de pago y conciliación de saldos.",
    requirements: "Habilidades de negociación y comunicación asertiva.",
    salaryRange: "RD$24,000 - RD$32,000",
    workType: "full_time",
    location: "Sede Principal",
    active: true,
  },
];

export const AREA_OPTS = [
  "Cobranza",
  "Vendedor",
  "Gerente de ventas",
  "Reclutador",
  "Cualquiera de las anteriores",
];

export const MODALIDAD_COMPENSACION_OPTS = [
  "Sueldo fijo más comisión",
  "Solo sueldo fijo",
  "Solo comisión, siempre que permita generar más de RD$40,000 mensuales",
  "Prefiero un sueldo fijo, aunque sea mínimo",
];

export const DISPOSICION_CAPACITACION_OPTS = [
  "Sí, completamente",
  "Sí, si recibo el acompañamiento necesario",
  "No estoy seguro/a",
  "No",
];

export const SEXO_OPTS = ["Masculino", "Femenino"];
export const ESTADO_CIVIL_OPTS = ["Soltero/a", "Casado/a", "Unión libre", "Divorciado/a", "Viudo/a"];
export const SI_NO = ["Sí", "No"];

export const RUBROS_LABORALES = [
  "Retail / Tiendas",
  "Moda / Belleza",
  "Restaurantes",
  "Servicio al cliente",
  "Ventas",
  "Administración",
  "Almacén / Logística",
  "Caja / POS",
  "Tecnología",
  "Salud",
  "Educación",
  "Construcción",
  "Seguridad",
  "Call Center / BPO",
  "Hotelería / Turismo",
  "Supermercados",
  "Farmacias",
  "Otro",
];

export const NIVEL_ACADEMICO_OPTS = [
  "Primaria",
  "Secundaria / Bachillerato",
  "Técnico / Vocacional",
  "Universitario en curso",
  "Universitario graduado",
  "Maestría / Postgrado",
];

export const TIPO_VIVIENDA_OPTS = ["Propia", "Alquilada", "Familiar", "Prestada", "Otro"];

export const STEP_TITLES: Record<string, string> = {
  foto: "Foto de perfil",
  cv: "Curriculum Vitae",
  cedula_frontal: "Documento de identidad",
  area_aplicar: "¿A qué área o puesto deseas aplicar?",
  nombre: "Datos personales básicos",
  celular: "Contacto principal",
  cedula: "Identificación y nacimiento",
  lugar_nacimiento: "Nacionalidad y origen",
  apodo: "Datos adicionales",
  direccion: "Ubicación de residencia",
  tiempo_viviendo: "Estabilidad en residencia",
  como_llegar: "Referencias de ubicación",
  nombre_padre: "Información de los padres",
  nombre_madre: "Información de la madre",
  telefono_padre: "Contacto de padres",
  telefono_madre: "Contacto de padres",
  estado_civil: "Estado civil y pareja",
  nombre_conyuge: "Datos de la pareja",
  hijos: "Cargas familiares",
  nivel_academico: "Nivel educativo",
  carrera: "Carrera o especialidad",
  cursos_talleres: "Capacitación adicional",
  oficio_profesion: "Oficio o profesión principal",
  experiencias_laborales: "Historial de experiencia laboral",
  ultimo_empleo_empresa: "Experiencia laboral reciente",
  ultimo_empleo_tiempo: "Tiempo en último empleo",
  ultimo_empleo_jefe: "Referencia laboral previa",
  ultimo_empleo_salario: "Remuneración anterior",
  ultimo_empleo_salida: "Motivo de salida",
  penultimo_empleo_empresa: "Experiencia laboral anterior",
  penultimo_empleo_tiempo: "Tiempo en penúltimo empleo",
  penultimo_empleo_jefe: "Referencia anterior",
  penultimo_empleo_salario: "Salario anterior",
  penultimo_empleo_salida: "Motivo de salida",
  familiar_empresa: "Conocidos en la empresa",
  recomendado_por: "Recomendación",
  afinidad_puesto: "Afinidad con el puesto",
  aporte_empresa: "¿Qué puedes aportar a la empresa?",
  disponibilidad_inicio: "Disponibilidad de inicio",
  modalidad_compensacion: "¿Cuál modalidad de compensación prefieres?",
  disposicion_capacitacion: "¿Estarías dispuesto/a a capacitarte?",
  sueldo_aspirado: "¿Cuál es tu sueldo aspirado?",
  dias_disponibles: "Disponibilidad semanal",
  horario_disponible: "Disponibilidad horaria",
  estudia_actualmente: "¿Estudia actualmente?",
  que_estudia: "¿Qué estudia?",
  horario_estudio: "Horario de estudio",
  dias_estudio: "Días de estudio",
  licencia_conducir: "¿Posee licencia de conducir?",
  vehiculo: "¿Posee vehículo propio?",
  enfermedad: "¿Padece alguna enfermedad?",
  cual_enfermedad: "¿Cuál enfermedad?",
  practica_deporte: "¿Practica algún deporte?",
};

export const DEFAULT_ENABLED_FIELDS: Record<string, boolean> = {
  foto: true,
  cv: true,
  cedula_frontal: true,
  cedula_trasera: true,
  area_aplicar: true,
  nombre: true,
  apellidos: true,
  sexo: true,
  celular: true,
  email: true,
  telefono_residencial: false,
  cedula: true,
  fecha_nacimiento: true,
  edad: true,
  lugar_nacimiento: false,
  nacionalidad: true,
  apodo: false,
  direccion: true,
  sector: true,
  ciudad: true,
  provincia: true,
  tipo_vivienda: false,
  tiempo_viviendo: false,
  como_llegar: false,
  alquiler_pago: false,
  nombre_padre: false,
  nombre_madre: false,
  telefono_padre: false,
  telefono_madre: false,
  padres_viven: false,
  padres_direccion: false,
  estado_civil: true,
  nombre_conyuge: false,
  hijos: true,
  cuantos_hijos: true,
  nivel_academico: true,
  institucion_educativa: false,
  carrera: false,
  cursos_talleres: true,
  oficio_profesion: true,
  experiencias_laborales: true,
  ultimo_empleo_empresa: true,
  ultimo_empleo_puesto: true,
  ultimo_empleo_tiempo: true,
  ultimo_empleo_jefe: false,
  ultimo_empleo_telefono: false,
  ultimo_empleo_salario: false,
  ultimo_empleo_salida: false,
  penultimo_empleo_empresa: false,
  penultimo_empleo_puesto: false,
  penultimo_empleo_tiempo: false,
  penultimo_empleo_jefe: false,
  penultimo_empleo_telefono: false,
  penultimo_empleo_salario: false,
  penultimo_empleo_salida: false,
  familiar_empresa: false,
  familiar_nombre: false,
  recomendado_por: false,
  afinidad_puesto: false,
  aporte_empresa: true,
  disponibilidad_inicio: true,
  modalidad_compensacion: true,
  disposicion_capacitacion: true,
  sueldo_aspirado: true,
  dias_disponibles: true,
  horario_disponible: true,
  estudia_actualmente: true,
  que_estudia: true,
  horario_estudio: false,
  dias_estudio: false,
  licencia_conducir: true,
  vehiculo: true,
  enfermedad: false,
  cual_enfermedad: false,
  practica_deporte: false,
};

export const DEFAULT_ENABLED_SECTIONS: Record<string, boolean> = {
  documentos: true,
  vacante: true,
  identificacion: true,
  residencia: true,
  familia: false,
  educacion: true,
  experiencia: true,
  intereses: true,
  compensacion: true,
  disponibilidad: true,
  estudios_actuales: true,
  movilidad: true,
  personalizadas: true,
};

export function isSectionEnabled(
  sectionId: string,
  settings?: TenantSettings | null
): boolean {
  if (!settings?.sections) return DEFAULT_ENABLED_SECTIONS[sectionId] ?? true;
  return settings.sections[sectionId] ?? DEFAULT_ENABLED_SECTIONS[sectionId] ?? true;
}

export function isFieldEnabled(
  fieldKey: string,
  settings?: TenantSettings | null
): boolean {
  if (!settings?.fields) return DEFAULT_ENABLED_FIELDS[fieldKey] ?? true;
  return settings.fields[fieldKey] ?? DEFAULT_ENABLED_FIELDS[fieldKey] ?? true;
}

export function collectAllFields(settings?: TenantSettings | null): FormField[] {
  const fields: FormField[] = [];

  const getLabel = (key: string, def: string) => settings?.customLabels?.[key] ?? def;
  const getPlaceholder = (key: string, def?: string) => settings?.customPlaceholders?.[key] ?? def;
  const getOptions = (key: string, def: string[]) => settings?.customOptions?.[key] ?? def;

  // Si hay puestos definidos en settings, usarlos en las opciones de área a aplicar
  let areaOptions = getOptions("area_aplicar", AREA_OPTS);
  if (Array.isArray(settings?.jobPositions) && settings.jobPositions.length > 0) {
    const activeTitles = settings.jobPositions.filter((p) => p.active).map((p) => p.title);
    if (activeTitles.length > 0) {
      areaOptions = [...activeTitles, "Otra posición / Candidatura general"];
    }
  }

  // 1. Documentos y fotos
  if (isSectionEnabled("documentos", settings)) {
    if (isFieldEnabled("foto", settings)) {
      fields.push({
        key: "foto",
        label: getLabel("foto", "Foto de perfil (rostro visible)"),
        type: "file",
        accept: "image/*",
        required: true,
      });
    }
    if (isFieldEnabled("cv", settings)) {
      fields.push({
        key: "cv",
        label: getLabel("cv", "Curriculum Vitae (PDF o imagen)"),
        type: "file",
        accept: ".pdf,image/*",
        required: true,
      });
    }
    if (isFieldEnabled("cedula_frontal", settings)) {
      fields.push({
        key: "cedula_frontal",
        label: getLabel("cedula_frontal", "Foto de cédula (lado frontal)"),
        type: "file",
        accept: "image/*",
        required: true,
      });
    }
    if (isFieldEnabled("cedula_trasera", settings)) {
      fields.push({
        key: "cedula_trasera",
        label: getLabel("cedula_trasera", "Foto de cédula (lado trasero)"),
        type: "file",
        accept: "image/*",
      });
    }
  }

  // 2. Vacante / Área
  if (isSectionEnabled("vacante", settings) && isFieldEnabled("area_aplicar", settings)) {
    fields.push({
      key: "area_aplicar",
      label: getLabel("area_aplicar", "¿A cuál área o vacante deseas aplicar?"),
      type: "select",
      options: areaOptions,
      required: true,
    });
  }

  // 3. Identificación personal
  if (isSectionEnabled("identificacion", settings)) {
    fields.push(
      { key: "nombre", label: getLabel("nombre", "Nombres"), type: "text", required: true, placeholder: getPlaceholder("nombre", "Ej. Juan Carlos") },
      { key: "apellidos", label: getLabel("apellidos", "Apellidos"), type: "text", required: true, placeholder: getPlaceholder("apellidos", "Ej. Pérez Gómez") },
      { key: "sexo", label: getLabel("sexo", "Sexo"), type: "select", options: SEXO_OPTS, required: true },
      { key: "celular", label: getLabel("celular", "Celular / WhatsApp"), type: "tel", required: true, placeholder: getPlaceholder("celular", "809-000-0000") },
      { key: "email", label: getLabel("email", "Correo electrónico"), type: "email", required: true, placeholder: getPlaceholder("email", "ejemplo@correo.com") },
      { key: "cedula", label: getLabel("cedula", "Número de cédula"), type: "text", required: true, placeholder: getPlaceholder("cedula", "001-0000000-0") },
      { key: "fecha_nacimiento", label: getLabel("fecha_nacimiento", "Fecha de nacimiento"), type: "date", required: true },
      { key: "nacionalidad", label: getLabel("nacionalidad", "Nacionalidad"), type: "text", required: true, placeholder: getPlaceholder("nacionalidad", "Dominicana") }
    );
  }

  // 4. Ubicación / Residencia
  if (isSectionEnabled("residencia", settings)) {
    fields.push({
      key: "direccion_completa",
      label: getLabel("direccion", "Ubicación de residencia"),
      type: "location",
      required: true,
    });
  }

  // 5. Estado civil e hijos
  if (isSectionEnabled("familia", settings)) {
    fields.push(
      { key: "estado_civil", label: getLabel("estado_civil", "Estado civil"), type: "select", options: ESTADO_CIVIL_OPTS },
      { key: "hijos", label: getLabel("hijos", "¿Tiene hijos?"), type: "select", options: SI_NO },
      { key: "cuantos_hijos", label: getLabel("cuantos_hijos", "¿Cuántos hijos tiene?"), type: "text", placeholder: "Ej. 2" }
    );
  }

  // 6. Nivel académico y profesión
  if (isSectionEnabled("educacion", settings)) {
    fields.push(
      { key: "nivel_academico", label: getLabel("nivel_academico", "Nivel académico alcanzado"), type: "select", options: getOptions("nivel_academico", NIVEL_ACADEMICO_OPTS), required: true },
      { key: "oficio_profesion", label: getLabel("oficio_profesion", "Oficio o profesión"), type: "select", options: getOptions("oficio_profesion", PROFESIONES), required: true },
      { key: "cursos_talleres", label: getLabel("cursos_talleres", "Cursos o capacitaciones adicionales"), type: "textarea", placeholder: getPlaceholder("cursos_talleres", "Ej. Excel avanzado, Servicio al cliente...") }
    );
  }

  // 7. Experiencia laboral
  if (isSectionEnabled("experiencia", settings)) {
    fields.push({
      key: "experiencia_laboral_block",
      label: getLabel("experiencias_laborales", "Historial de experiencia laboral"),
      type: "work_experience",
      required: true,
    });
  }

  // 8. Intereses y aporte a la empresa
  if (isSectionEnabled("intereses", settings)) {
    fields.push(
      { key: "aporte_empresa", label: getLabel("aporte_empresa", "¿Qué puedes aportar a nuestra empresa?"), type: "textarea", required: true, placeholder: getPlaceholder("aporte_empresa", "Cuéntanos tus fortalezas y compromiso...") },
      { key: "disponibilidad_inicio", label: getLabel("disponibilidad_inicio", "¿Cuándo podrías iniciar a trabajar?"), type: "select", options: getOptions("disponibilidad_inicio", DISPONIBILIDAD), required: true }
    );
  }

  // 9. Compensación y aspiraciones salariales
  if (isSectionEnabled("compensacion", settings)) {
    fields.push(
      { key: "modalidad_compensacion", label: getLabel("modalidad_compensacion", "¿Cuál modalidad de compensación prefieres?"), type: "select", options: getOptions("modalidad_compensacion", MODALIDAD_COMPENSACION_OPTS), required: true },
      { key: "sueldo_aspirado", label: getLabel("sueldo_aspirado", "¿Cuál es tu sueldo aspirado mensual (RD$)?"), type: "text", required: true, placeholder: getPlaceholder("sueldo_aspirado", "Ej. 28,000") }
    );
  }

  // 10. Disponibilidad de días y horarios
  if (isSectionEnabled("disponibilidad", settings)) {
    fields.push(
      { key: "dias_disponibles", label: getLabel("dias_disponibles", "¿Cuáles días de la semana estás disponible para trabajar?"), type: "multiselect", options: getOptions("dias_disponibles", DIAS_SEMANA), required: true },
      { key: "horario_disponible", label: getLabel("horario_disponible", "¿Cuál horario tienes disponible?"), type: "text", required: true, placeholder: getPlaceholder("horario_disponible", "Ej. 8:00 AM a 5:00 PM o Rotativo") }
    );
  }

  // 11. Estudios actuales
  if (isSectionEnabled("estudios_actuales", settings)) {
    fields.push(
      { key: "estudia_actualmente", label: getLabel("estudia_actualmente", "¿Estudia actualmente?"), type: "select", options: SI_NO, required: true },
      { key: "que_estudia", label: getLabel("que_estudia", "¿Qué carrera o curso estudia actualmente?"), type: "text", placeholder: getPlaceholder("que_estudia", "Ej. Mercadeo (Noche)") }
    );
  }

  // 12. Movilidad
  if (isSectionEnabled("movilidad", settings)) {
    fields.push(
      { key: "licencia_conducir", label: getLabel("licencia_conducir", "¿Licencia de conducir?"), type: "select", options: SI_NO },
      { key: "vehiculo", label: getLabel("vehiculo", "¿Vehículo propio?"), type: "select", options: SI_NO }
    );
  }

  // 13. Preguntas personalizadas creadas por la empresa
  if (Array.isArray(settings?.customQuestions) && settings.customQuestions.length > 0) {
    for (const q of settings.customQuestions) {
      if (!q.id || !q.label) continue;
      const fieldType: FormFieldType =
        q.type === "textarea" ? "textarea" : q.type === "select" || q.type === "yes_no" ? "select" : "text";

      const opts = q.type === "yes_no" ? SI_NO : q.options && q.options.length ? q.options : ["Opción 1", "Opción 2"];

      fields.push({
        key: `custom_${q.id}`,
        label: q.label,
        type: fieldType,
        options: fieldType === "select" ? opts : undefined,
        required: q.required !== false,
        placeholder: q.placeholder,
      });
    }
  }

  return fields;
}

function chunkIntoWizardSteps(fields: FormField[], maxPerStep = 2, settings?: TenantSettings | null): FormSection[] {
  const sections: FormSection[] = [];
  let buffer: FormField[] = [];

  const getStepTitle = (field: FormField) => {
    return (
      settings?.customLabels?.[`${field.key}_title`] ??
      STEP_TITLES[field.key] ??
      field.label
    );
  };

  for (const field of fields) {
    if (
      field.type === "location" ||
      field.type === "work_experience" ||
      field.key === "area_aplicar" ||
      field.key === "modalidad_compensacion" ||
      field.key === "disposicion_capacitacion" ||
      field.key === "aporte_empresa" ||
      field.key.startsWith("custom_")
    ) {
      if (buffer.length) {
        sections.push(makeStep(buffer, sections.length, settings));
        buffer = [];
      }
      sections.push({
        id: `step_${field.key}`,
        title: getStepTitle(field),
        fields: [field],
      });
      continue;
    }

    buffer.push(field);
    if (buffer.length >= maxPerStep) {
      sections.push(makeStep(buffer, sections.length, settings));
      buffer = [];
    }
  }

  if (buffer.length) sections.push(makeStep(buffer, sections.length, settings));
  return sections;
}

function makeStep(fields: FormField[], index: number, settings?: TenantSettings | null): FormSection {
  const first = fields[0];
  const title =
    settings?.customLabels?.[`${first.key}_title`] ??
    STEP_TITLES[first.key] ??
    first.label;

  return {
    id: `step_${index}_${first.key}`,
    title,
    fields,
  };
}

export function buildFormSections(settings: TenantSettings | null | undefined): FormSection[] {
  return chunkIntoWizardSteps(collectAllFields(settings), 2, settings);
}

/** @deprecated use rubros_laborales */
export const SECTORES_EXPERIENCIA = RUBROS_LABORALES;
export const PROVINCIAS_RD: string[] = [];
