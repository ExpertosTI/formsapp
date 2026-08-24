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

export interface CustomQuestion {
  id: string;
  title: string;
  label: string;
  type: "text" | "textarea" | "select" | "yes_no";
  options?: string[];
  required?: boolean;
  placeholder?: string;
}

export interface TenantSettings {
  formType?: FormType;
  sections?: Record<string, boolean>;
  fields?: Record<string, boolean>;
  customLabels?: Record<string, string>;
  customPlaceholders?: Record<string, string>;
  customOptions?: Record<string, string[]>;
  customQuestions?: CustomQuestion[];
  themeMode?: ThemeMode;
  introText?: string;
  whatsappInstance?: string;
  whatsappToken?: string;
  notifyOnSubmission?: boolean;
  adminNotifyPhone?: string;
}

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
  "Otro",
];

export const STEP_TITLES: Record<string, string> = {
  area_aplicar: "Área a la que deseas aplicar",
  modalidad_compensacion: "Modalidad de compensación preferida",
  aporte_empresa: "Tu aporte y compromiso",
  disposicion_capacitacion: "Capacitación y trabajo por metas",
  nombre: "¿Cómo te llamas?",
  apellido: "¿Cómo te llamas?",
  cedula: "Documento de identidad",
  fecha_nacimiento: "Datos personales",
  lugar_nacimiento: "Datos personales",
  nacionalidad: "Datos personales",
  sexo: "Datos personales",
  estado_civil: "Datos personales",
  location: "¿Dónde vives?",
  celular: "Contacto",
  correo: "Contacto",
  tel_casa: "Contacto",
  oficio_profesion: "Tu perfil profesional",
  sueldo_aspirado: "Tu perfil profesional",
  rubros_laborales: "Rubros donde has trabajado",
  habilidades: "Habilidades",
  red_profesional: "Red profesional",
  experiencia: "Experiencia laboral",
  trabajando_actualmente: "Situación actual",
  razon_dejar_empleo: "Situación actual",
  tiempo_disponible: "Disponibilidad",
  primaria: "Formación académica",
  secundaria: "Formación académica",
  universitaria: "Formación académica",
  especialidad: "Formación académica",
  estudia_actualmente: "Formación académica",
  dia_clases: "Formación académica",
  familiares: "Referencias familiares",
  familiar_empresa: "Referencias",
  recomendado: "Referencias",
  curriculum: "Documentos",
  foto: "Documentos",
  licencia_conducir: "Información adicional",
  vehiculo: "Información adicional",
  enfermedad: "Información adicional",
  cual_enfermedad: "Información adicional",
  practica_deporte: "Información adicional",
};

export function collectAllFields(settings: TenantSettings | null | undefined): FormField[] {
  const formType = settings?.formType ?? "simple";
  const onSection = (key: string, defaultOn = true) =>
    settings?.sections?.[key] !== false && (defaultOn || settings?.sections?.[key] === true);

  const onField = (key: string, defaultOn = true) =>
    settings?.fields?.[key] !== false && (defaultOn || settings?.fields?.[key] === true);

  const getLabel = (key: string, def: string) => settings?.customLabels?.[key] || def;
  const getPlaceholder = (key: string, def?: string) => settings?.customPlaceholders?.[key] || def;
  const getOptions = (key: string, def: string[]) => {
    const custom = settings?.customOptions?.[key];
    return Array.isArray(custom) && custom.length > 0 ? custom : def;
  };

  const areaField: FormField = {
    key: "area_aplicar",
    label: getLabel("area_aplicar", "Deseas aplicar para qué área:"),
    type: "select",
    options: getOptions("area_aplicar", AREA_OPTS),
    required: true,
  };

  const modalCompensacionField: FormField = {
    key: "modalidad_compensacion",
    label: getLabel("modalidad_compensacion", "¿Qué modalidad de compensación prefieres?"),
    type: "select",
    options: getOptions("modalidad_compensacion", MODALIDAD_COMPENSACION_OPTS),
    required: true,
  };

  const dispCapacitacionField: FormField = {
    key: "disposicion_capacitacion",
    label: getLabel("disposicion_capacitacion", "¿Estás dispuesto/a a capacitarte, cumplir metas y trabajar bajo resultados?"),
    type: "select",
    options: getOptions("disposicion_capacitacion", DISPOSICION_CAPACITACION_OPTS),
    required: true,
  };

  const aporteEmpresaField: FormField = {
    key: "aporte_empresa",
    label: getLabel(
      "aporte_empresa",
      "Si te diéramos la oportunidad de formar parte de nuestra empresa, ¿qué estarías dispuesto/a a aportar para crecer, alcanzar tus metas y contribuir al éxito del equipo?"
    ),
    type: "textarea",
    placeholder: getPlaceholder("aporte_empresa", "Escribe tu respuesta aquí..."),
    required: true,
  };

  const fields: FormField[] = [];

  // Área / Vacante a aplicar (configurable)
  if (onSection("area_aplicar", true)) {
    fields.push(areaField);
  }

  // Datos personales básicos
  if (onSection("datos_personales", true)) {
    fields.push(
      { key: "nombre", label: getLabel("nombre", "Nombre"), type: "text", required: true, placeholder: getPlaceholder("nombre", "Ej. Juan") },
      { key: "apellido", label: getLabel("apellido", "Apellido"), type: "text", required: true, placeholder: getPlaceholder("apellido", "Ej. Pérez") }
    );
    if (onField("cedula", true)) {
      fields.push({ key: "cedula", label: getLabel("cedula", "Cédula"), type: "text", required: true, placeholder: getPlaceholder("cedula", "402-1234567-8") });
    }
    if (formType !== "simple") {
      if (onField("fecha_nacimiento", true)) {
        fields.push({ key: "fecha_nacimiento", label: getLabel("fecha_nacimiento", "Fecha de nacimiento"), type: "date", required: true });
      }
      if (onField("lugar_nacimiento", true)) {
        fields.push({ key: "lugar_nacimiento", label: getLabel("lugar_nacimiento", "Lugar de nacimiento"), type: "text", required: true });
      }
      if (onField("nacionalidad", true)) {
        fields.push({ key: "nacionalidad", label: getLabel("nacionalidad", "Nacionalidad"), type: "text", required: true, placeholder: getPlaceholder("nacionalidad", "Dominicana") });
      }
      if (onField("sexo", true)) {
        fields.push({ key: "sexo", label: getLabel("sexo", "Sexo"), type: "select", options: getOptions("sexo", SEXO_OPTS), required: true });
      }
      if (onField("estado_civil", true)) {
        fields.push({ key: "estado_civil", label: getLabel("estado_civil", "Estado civil"), type: "select", options: getOptions("estado_civil", ESTADO_CIVIL_OPTS), required: true });
      }
    }
  }

  // Contacto
  if (onSection("contacto", true)) {
    fields.push(
      { key: "celular", label: getLabel("celular", "Celular"), type: "tel", required: true, placeholder: getPlaceholder("celular", "(809) 555-1234") },
      { key: "correo", label: getLabel("correo", "Correo electrónico"), type: "email", required: true, placeholder: getPlaceholder("correo", "tu@correo.com") }
    );
    if (formType !== "simple" && onField("tel_casa", true)) {
      fields.push({ key: "tel_casa", label: getLabel("tel_casa", "Teléfono de casa"), type: "tel", placeholder: getPlaceholder("tel_casa", "555-1234") });
    }
  }

  // Ubicación
  if (onSection("ubicacion", true)) {
    fields.push({ key: "location", label: getLabel("location", "Ubicación"), type: "location", required: true });
  }

  // Perfil profesional
  if (onSection("perfil_profesional", true)) {
    if (onField("oficio_profesion", true)) {
      fields.push({
        key: "oficio_profesion",
        label: getLabel("oficio_profesion", "Oficio / Profesión"),
        type: "select",
        options: getOptions("oficio_profesion", PROFESIONES),
        required: true,
      });
    }
    if (onField("sueldo_aspirado", true)) {
      fields.push({
        key: "sueldo_aspirado",
        label: getLabel("sueldo_aspirado", "Sueldo aspirado (RD$)"),
        type: "text",
        required: true,
        placeholder: getPlaceholder("sueldo_aspirado", "Ej. 25,000"),
      });
    }
    if (formType !== "simple") {
      if (onField("rubros_laborales", true)) {
        fields.push({
          key: "rubros_laborales",
          label: getLabel("rubros_laborales", "Rubros laborales"),
          type: "multiselect",
          options: getOptions("rubros_laborales", RUBROS_LABORALES),
          required: true,
        });
      }
      if (onField("habilidades", true)) {
        fields.push({
          key: "habilidades",
          label: getLabel("habilidades", "Habilidades"),
          type: "textarea",
          placeholder: getPlaceholder("habilidades", "Ej. Excel, inglés, manejo de caja…"),
        });
      }
      if (onField("red_profesional", false)) {
        fields.push({
          key: "red_profesional",
          label: getLabel("red_profesional", "Red profesional (opcional)"),
          type: "url",
          placeholder: getPlaceholder("red_profesional", "https://…"),
        });
      }
    }
  }

  // Preguntas de expectativas y compromiso
  if (onSection("modalidad_compensacion", true)) fields.push(modalCompensacionField);
  if (onSection("disposicion_capacitacion", true)) fields.push(dispCapacitacionField);
  if (onSection("aporte_empresa", true)) fields.push(aporteEmpresaField);

  // Experiencia laboral
  if (formType !== "simple" && onSection("experiencia_laboral", true)) {
    fields.push(
      {
        key: "experiencia",
        label: getLabel("experiencia", "Experiencia laboral"),
        type: "work_experience",
        required: true,
      },
      {
        key: "trabajando_actualmente",
        label: getLabel("trabajando_actualmente", "¿Trabaja actualmente?"),
        type: "select",
        options: SI_NO,
        required: true,
      },
      {
        key: "razon_dejar_empleo",
        label: getLabel("razon_dejar_empleo", "Motivo de salida del empleo anterior"),
        type: "textarea",
        placeholder: getPlaceholder("razon_dejar_empleo", "Escribe el motivo…"),
      },
      {
        key: "tiempo_disponible",
        label: getLabel("tiempo_disponible", "Disponibilidad para empezar"),
        type: "select",
        options: getOptions("tiempo_disponible", DISPONIBILIDAD),
        required: true,
      }
    );
  }

  // Preparación académica
  if (formType !== "simple" && onSection("preparacion_academica", true)) {
    fields.push(
      { key: "primaria", label: getLabel("primaria", "Primaria"), type: "text" },
      { key: "secundaria", label: getLabel("secundaria", "Secundaria"), type: "text" },
      { key: "universitaria", label: getLabel("universitaria", "Universitaria"), type: "text" },
      { key: "especialidad", label: getLabel("especialidad", "Especialidad / Carrera"), type: "text" },
      { key: "estudia_actualmente", label: getLabel("estudia_actualmente", "¿Estudia actualmente?"), type: "select", options: SI_NO },
      { key: "dia_clases", label: getLabel("dia_clases", "Días de clases"), type: "multiselect", options: DIAS_SEMANA }
    );
  }

  // Referencias familiares
  if (formType !== "simple" && onSection("datos_familiares", false)) {
    fields.push(
      { key: "familiares", label: getLabel("familiares", "Familiares (nombre, parentesco, ocupación)"), type: "textarea" },
      { key: "familiar_empresa", label: getLabel("familiar_empresa", "¿Familiar en la empresa?"), type: "select", options: SI_NO },
      { key: "recomendado", label: getLabel("recomendado", "¿Recomendado por alguien?"), type: "select", options: SI_NO }
    );
  }

  // Documentos
  if (onSection("documentos", true)) {
    if (onField("curriculum", true)) {
      fields.push({
        key: "curriculum",
        label: getLabel("curriculum", "Curriculum vitae"),
        type: "file",
        accept: ".pdf,.doc,.docx",
        required: true,
      });
    }
    if (onField("foto", true)) {
      fields.push({
        key: "foto",
        label: getLabel("foto", "Foto reciente"),
        type: "file",
        accept: "image/jpeg,image/png,image/webp",
        required: true,
      });
    }
  }

  // Información adicional
  if (formType !== "simple" && onSection("informacion_adicional", true)) {
    fields.push(
      { key: "licencia_conducir", label: getLabel("licencia_conducir", "¿Licencia de conducir?"), type: "select", options: SI_NO },
      { key: "vehiculo", label: getLabel("vehiculo", "¿Vehículo propio?"), type: "select", options: SI_NO },
      { key: "enfermedad", label: getLabel("enfermedad", "¿Padece alguna enfermedad?"), type: "select", options: SI_NO },
      { key: "cual_enfermedad", label: getLabel("cual_enfermedad", "¿Cuál enfermedad?"), type: "text" },
      { key: "practica_deporte", label: getLabel("practica_deporte", "¿Practica deporte?"), type: "select", options: SI_NO }
    );
  }

  // Preguntas personalizadas creadas por la empresa
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

/** Divide todos los campos en pasos cortos (máx. 2 por pantalla) */
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
