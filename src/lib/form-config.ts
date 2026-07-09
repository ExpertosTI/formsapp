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
  | "location";

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

export interface TenantSettings {
  sections?: Record<string, boolean>;
  themeMode?: ThemeMode;
  introText?: string;
}

const SEXO_OPTS = ["Masculino", "Femenino"];
const ESTADO_CIVIL_OPTS = ["Soltero/a", "Casado/a", "Unión libre", "Divorciado/a", "Viudo/a"];
const SI_NO = ["Sí", "No"];

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

const STEP_TITLES: Record<string, string> = {
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

function collectAllFields(settings: TenantSettings | null | undefined): FormField[] {
  const on = (key: string, defaultOn = true) =>
    settings?.sections?.[key] !== false && (defaultOn || settings?.sections?.[key] === true);

  const fields: FormField[] = [
    { key: "nombre", label: "Nombre", type: "text", required: true },
    { key: "apellido", label: "Apellido", type: "text", required: true },
    { key: "cedula", label: "Cédula", type: "text", required: true },
    { key: "fecha_nacimiento", label: "Fecha de nacimiento", type: "date", required: true },
    { key: "lugar_nacimiento", label: "Lugar de nacimiento", type: "text", required: true },
    { key: "nacionalidad", label: "Nacionalidad", type: "text", required: true, placeholder: "Dominicana" },
    { key: "sexo", label: "Sexo", type: "select", options: SEXO_OPTS, required: true },
    { key: "estado_civil", label: "Estado civil", type: "select", options: ESTADO_CIVIL_OPTS, required: true },
    { key: "location", label: "Ubicación", type: "location", required: true },
    { key: "celular", label: "Celular", type: "tel", required: true },
    { key: "correo", label: "Correo electrónico", type: "email", required: true },
    { key: "tel_casa", label: "Teléfono de casa", type: "tel" },
    { key: "oficio_profesion", label: "Oficio / Profesión", type: "select", options: PROFESIONES, required: true },
    { key: "sueldo_aspirado", label: "Sueldo aspirado (RD$)", type: "text", required: true, placeholder: "Ej. 25,000" },
    {
      key: "rubros_laborales",
      label: "Rubros laborales",
      type: "multiselect",
      options: RUBROS_LABORALES,
      required: true,
    },
    { key: "habilidades", label: "Habilidades", type: "textarea", placeholder: "Ej. Excel, inglés, manejo de caja…" },
    { key: "red_profesional", label: "Red profesional (opcional)", type: "url", placeholder: "https://…" },
  ];

  if (on("experiencia_laboral", true)) {
    fields.push(
      { key: "experiencia", label: "Experiencia laboral", type: "textarea", required: true, placeholder: "Empresas, cargos y años…" },
      { key: "trabajando_actualmente", label: "¿Trabaja actualmente?", type: "select", options: SI_NO, required: true },
      { key: "razon_dejar_empleo", label: "Motivo de salida del empleo anterior", type: "textarea" },
      { key: "tiempo_disponible", label: "Disponibilidad para empezar", type: "select", options: DISPONIBILIDAD, required: true }
    );
  }

  if (on("preparacion_academica", true)) {
    fields.push(
      { key: "primaria", label: "Primaria", type: "text" },
      { key: "secundaria", label: "Secundaria", type: "text" },
      { key: "universitaria", label: "Universitaria", type: "text" },
      { key: "especialidad", label: "Especialidad / Carrera", type: "text" },
      { key: "estudia_actualmente", label: "¿Estudia actualmente?", type: "select", options: SI_NO },
      { key: "dia_clases", label: "Días de clases", type: "multiselect", options: DIAS_SEMANA }
    );
  }

  if (on("datos_familiares", false)) {
    fields.push(
      { key: "familiares", label: "Familiares (nombre, parentesco, ocupación)", type: "textarea" },
      { key: "familiar_empresa", label: "¿Familiar en la empresa?", type: "select", options: SI_NO },
      { key: "recomendado", label: "¿Recomendado por alguien?", type: "select", options: SI_NO }
    );
  }

  if (on("documentos", true)) {
    fields.push(
      { key: "curriculum", label: "Curriculum vitae", type: "file", accept: ".pdf,.doc,.docx", required: true },
      { key: "foto", label: "Foto reciente", type: "file", accept: "image/jpeg,image/png,image/webp", required: true }
    );
  }

  fields.push(
    { key: "licencia_conducir", label: "¿Licencia de conducir?", type: "select", options: SI_NO },
    { key: "vehiculo", label: "¿Vehículo propio?", type: "select", options: SI_NO },
    { key: "enfermedad", label: "¿Padece alguna enfermedad?", type: "select", options: SI_NO },
    { key: "cual_enfermedad", label: "¿Cuál enfermedad?", type: "text" },
    { key: "practica_deporte", label: "¿Practica deporte?", type: "select", options: SI_NO }
  );

  return fields;
}

/** Divide todos los campos en pasos cortos (máx. 2 por pantalla) */
function chunkIntoWizardSteps(fields: FormField[], maxPerStep = 2): FormSection[] {
  const sections: FormSection[] = [];
  let buffer: FormField[] = [];

  for (const field of fields) {
    if (field.type === "location") {
      if (buffer.length) {
        sections.push(makeStep(buffer, sections.length));
        buffer = [];
      }
      sections.push({
        id: `step_location`,
        title: STEP_TITLES.location,
        fields: [field],
      });
      continue;
    }

    buffer.push(field);
    if (buffer.length >= maxPerStep) {
      sections.push(makeStep(buffer, sections.length));
      buffer = [];
    }
  }

  if (buffer.length) sections.push(makeStep(buffer, sections.length));
  return sections;
}

function makeStep(fields: FormField[], index: number): FormSection {
  const title = STEP_TITLES[fields[0].key] ?? fields[0].label;
  return {
    id: `step_${index}_${fields[0].key}`,
    title,
    fields,
  };
}

export function buildFormSections(settings: TenantSettings | null | undefined): FormSection[] {
  return chunkIntoWizardSteps(collectAllFields(settings), 2);
}

/** @deprecated use rubros_laborales */
export const SECTORES_EXPERIENCIA = RUBROS_LABORALES;
export const PROVINCIAS_RD: string[] = [];
