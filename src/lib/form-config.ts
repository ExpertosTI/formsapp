export type FormFieldType =
  | "text"
  | "email"
  | "tel"
  | "date"
  | "textarea"
  | "select"
  | "file"
  | "multiselect"
  | "url";

export interface FormField {
  key: string;
  label: string;
  type: FormFieldType;
  required?: boolean;
  options?: string[];
  accept?: string;
  placeholder?: string;
  hint?: string;
}

export interface FormSection {
  id: string;
  title: string;
  subtitle?: string;
  fields: FormField[];
}

export type FormVariant = "compact" | "full";
export type ThemeMode = "dark" | "light" | "system";

export interface TenantSettings {
  sections?: Record<string, boolean>;
  formVariant?: FormVariant;
  themeMode?: ThemeMode;
  introText?: string;
}

const SEXO_OPTS = ["Masculino", "Femenino"];
const ESTADO_CIVIL_OPTS = ["Soltero/a", "Casado/a", "Unión libre", "Divorciado/a", "Viudo/a"];
const SI_NO = ["Sí", "No"];

export const PROVINCIAS_RD = [
  "Distrito Nacional",
  "Santo Domingo",
  "Santiago",
  "La Vega",
  "San Cristóbal",
  "Puerto Plata",
  "La Altagracia",
  "San Pedro de Macorís",
  "Duarte",
  "Espaillat",
  "Azua",
  "Peravia",
  "San Juan",
  "Valverde",
  "Monte Plata",
  "Hato Mayor",
  "Otra",
];

export const SECTORES_EXPERIENCIA = [
  "Retail / Tiendas",
  "Moda / Belleza",
  "Restaurantes / Hostelería",
  "Servicio al cliente",
  "Ventas / Comercial",
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

function ubicacionFields(required = true): FormField[] {
  return [
    {
      key: "provincia",
      label: "Provincia",
      type: "select",
      options: PROVINCIAS_RD,
      required,
    },
    { key: "ciudad", label: "Ciudad / Municipio", type: "text", required, placeholder: "Ej. Santo Domingo Este" },
    {
      key: "sectores_experiencia",
      label: "Sectores de experiencia",
      type: "multiselect",
      options: SECTORES_EXPERIENCIA,
      required,
      hint: "Selecciona uno o más sectores donde has trabajado",
    },
  ];
}

function perfilProfesionalFields(): FormField[] {
  return [
    { key: "oficio_profesion", label: "Oficio / Profesión", type: "text", required: true, placeholder: "Ej. Cajera, vendedora" },
    { key: "sueldo_aspirado", label: "Sueldo aspirado (RD$)", type: "text", required: true, placeholder: "Ej. 25000" },
    {
      key: "habilidades",
      label: "Habilidades clave",
      type: "textarea",
      placeholder: "Ej. Excel, atención al cliente, manejo de caja, inglés básico…",
      hint: "Separa con comas o líneas",
    },
    {
      key: "linkedin_url",
      label: "Perfil LinkedIn (opcional)",
      type: "url",
      placeholder: "https://linkedin.com/in/tu-perfil",
    },
  ];
}

export function buildFormSections(
  settings: TenantSettings | null | undefined,
  variant?: FormVariant
): FormSection[] {
  const v = variant ?? settings?.formVariant ?? "compact";
  return v === "compact" ? buildCompactSections(settings) : buildFullSections(settings);
}

/** Formulario corto y moderno (4 pasos) — recomendado */
export function buildCompactSections(settings: TenantSettings | null | undefined): FormSection[] {
  const on = (key: string, defaultOn = true) =>
    settings?.sections?.[key] !== false && (defaultOn || settings?.sections?.[key] === true);

  const sections: FormSection[] = [
    {
      id: "contacto",
      title: "Tu perfil",
      subtitle: "Datos de contacto y ubicación",
      fields: [
        { key: "nombre", label: "Nombre", type: "text", required: true },
        { key: "apellido", label: "Apellido", type: "text", required: true },
        { key: "cedula", label: "Cédula", type: "text", required: true },
        { key: "correo", label: "Correo electrónico", type: "email", required: true },
        { key: "celular", label: "Celular", type: "tel", required: true },
        ...ubicacionFields(true),
        ...perfilProfesionalFields(),
      ],
    },
    {
      id: "experiencia_laboral",
      title: "Experiencia laboral",
      subtitle: "Cuéntanos tu trayectoria",
      fields: [
        {
          key: "experiencia",
          label: "Experiencia laboral",
          type: "textarea",
          required: true,
          placeholder: "Empresa, puesto, años de experiencia…",
          hint: "Incluye empresas, cargos y tiempo en cada rol",
        },
        { key: "trabajando_actualmente", label: "¿Trabaja actualmente?", type: "select", options: SI_NO, required: true },
        { key: "razon_dejar_empleo", label: "Razón de dejar empleo anterior", type: "textarea" },
        { key: "tiempo_disponible", label: "Disponibilidad para empezar", type: "text", required: true, placeholder: "Ej. Inmediato" },
      ],
    },
  ];

  if (on("preparacion_academica", true)) {
    sections.push({
      id: "preparacion_academica",
      title: "Formación",
      subtitle: "Estudios y capacitación",
      fields: [
        { key: "primaria", label: "Primaria", type: "text" },
        { key: "secundaria", label: "Secundaria", type: "text" },
        { key: "universitaria", label: "Universitaria", type: "text" },
        { key: "especialidad", label: "Especialidad / Carrera", type: "text" },
        { key: "estudia_actualmente", label: "¿Estudia actualmente?", type: "select", options: SI_NO },
      ],
    });
  }

  if (on("documentos", true)) {
    sections.push({
      id: "documentos",
      title: "Documentos",
      subtitle: "CV y foto de perfil",
      fields: [
        { key: "curriculum", label: "Curriculum vitae", type: "file", accept: ".pdf,.doc,.docx", required: true },
        { key: "foto", label: "Foto profesional", type: "file", accept: "image/jpeg,image/png,image/webp", required: true },
      ],
    });
  }

  return sections;
}

/** Formulario completo (más campos personales) */
export function buildFullSections(settings: TenantSettings | null | undefined): FormSection[] {
  const on = (key: string, defaultOn = true) =>
    settings?.sections?.[key] !== false && (defaultOn || settings?.sections?.[key] === true);

  const sections: FormSection[] = [];

  if (on("informacion_general", true)) {
    sections.push({
      id: "informacion_general",
      title: "Información general",
      subtitle: "Datos personales",
      fields: [
        { key: "nombre", label: "Nombre", type: "text", required: true },
        { key: "apellido", label: "Apellido", type: "text", required: true },
        { key: "cedula", label: "Cédula", type: "text", required: true },
        { key: "fecha_nacimiento", label: "Fecha de nacimiento", type: "date", required: true },
        { key: "lugar_nacimiento", label: "Lugar de nacimiento", type: "text", required: true },
        { key: "nacionalidad", label: "Nacionalidad", type: "text", required: true },
        { key: "sexo", label: "Sexo", type: "select", options: SEXO_OPTS, required: true },
        { key: "estado_civil", label: "Estado civil", type: "select", options: ESTADO_CIVIL_OPTS, required: true },
        { key: "direccion", label: "Dirección", type: "textarea", required: true },
        { key: "celular", label: "Celular", type: "tel", required: true },
        { key: "correo", label: "Correo electrónico", type: "email", required: true },
        { key: "tel_casa", label: "Teléfono casa", type: "tel" },
        ...ubicacionFields(false),
        ...perfilProfesionalFields(),
      ],
    });
  }

  if (on("experiencia_laboral", true)) {
    sections.push({
      id: "experiencia_laboral",
      title: "Experiencia laboral",
      fields: [
        { key: "experiencia", label: "Experiencia laboral", type: "textarea", required: true },
        { key: "trabajando_actualmente", label: "¿Trabaja actualmente?", type: "select", options: SI_NO, required: true },
        { key: "razon_dejar_empleo", label: "Razón de dejar empleo anterior", type: "textarea" },
        { key: "tiempo_disponible", label: "Tiempo disponible para empezar", type: "text", required: true },
      ],
    });
  }

  if (on("preparacion_academica", true)) {
    sections.push({
      id: "preparacion_academica",
      title: "Preparación académica",
      fields: [
        { key: "primaria", label: "Primaria", type: "text" },
        { key: "secundaria", label: "Secundaria", type: "text" },
        { key: "universitaria", label: "Universitaria", type: "text" },
        { key: "especialidad", label: "Especialidad", type: "text" },
        { key: "estudia_actualmente", label: "¿Estudia actualmente?", type: "select", options: SI_NO },
        { key: "dia_clases", label: "Días de clases", type: "text" },
      ],
    });
  }

  if (on("datos_familiares", false)) {
    sections.push({
      id: "datos_familiares",
      title: "Datos familiares",
      fields: [
        { key: "familiares", label: "Familiares (nombre, parentesco, ocupación, teléfono)", type: "textarea" },
        { key: "familiar_empresa", label: "¿Familiar en la empresa?", type: "select", options: SI_NO },
        { key: "recomendado", label: "¿Recomendado por alguien?", type: "select", options: SI_NO },
      ],
    });
  }

  if (on("documentos", true)) {
    sections.push({
      id: "documentos",
      title: "Documentos",
      fields: [
        { key: "curriculum", label: "Curriculum vitae (PDF)", type: "file", accept: ".pdf,.doc,.docx", required: true },
        { key: "foto", label: "Foto reciente", type: "file", accept: "image/jpeg,image/png,image/webp", required: true },
      ],
    });
  }

  sections.push({
    id: "adicional",
    title: "Información adicional",
    fields: [
      { key: "licencia_conducir", label: "¿Licencia de conducir?", type: "select", options: SI_NO },
      { key: "vehiculo", label: "¿Vehículo propio?", type: "select", options: SI_NO },
      { key: "enfermedad", label: "¿Padece alguna enfermedad?", type: "select", options: SI_NO },
      { key: "cual_enfermedad", label: "¿Cuál enfermedad?", type: "text" },
      { key: "practica_deporte", label: "¿Practica deporte?", type: "select", options: SI_NO },
    ],
  });

  return sections;
}
