import { formatLocation } from "./rd-locations";
import { formatWorkExperienceDisplay } from "./work-experience";

export type SubmissionData = Record<string, string | number | boolean | null | undefined>;
export type SubmissionFiles = Record<string, string>;

export const STATUS_LABELS: Record<string, string> = {
  nuevo: "Nuevo",
  favorito: "Pendiente / Favorito",
  revisado: "Revisado",
  aceptado: "Aceptado",
  entrevista: "Entrevista",
  contratado: "Contratado",
  archivado: "Archivado",
};

export const STATUS_COLORS: Record<string, string> = {
  nuevo: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  favorito: "bg-pink-500/20 text-pink-300 border-pink-500/30",
  revisado: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  aceptado: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  entrevista: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  contratado: "bg-teal-500/20 text-teal-200 border-teal-500/30",
  archivado: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

/** Estados en los que se puede eliminar el candidato de forma segura */
export const DELETABLE_STATUSES = ["contratado", "archivado", "entrevista", "aceptado"] as const;

export function asSubmissionData(value: unknown): SubmissionData {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as SubmissionData;
  }
  return {};
}

export function asSubmissionFiles(value: unknown): SubmissionFiles {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as SubmissionFiles;
  }
  return {};
}

export function getCandidateName(data: SubmissionData): string {
  const nombre = String(data.nombre ?? "").trim();
  const apellido = String(data.apellido ?? "").trim();
  return [nombre, apellido].filter(Boolean).join(" ") || "Sin nombre";
}

export function getCandidateInitials(data: SubmissionData): string {
  const nombre = String(data.nombre ?? "?").charAt(0).toUpperCase();
  const apellido = String(data.apellido ?? "?").charAt(0).toUpperCase();
  return `${nombre}${apellido}`;
}

export function getCandidateHeadline(data: SubmissionData): string {
  const area = String(data.area_aplicar ?? "").trim();
  const profesion = String(data.oficio_profesion ?? data.especialidad ?? "").trim();
  if (area && profesion && area !== profesion) {
    return `${area} · ${profesion}`;
  }
  return area || profesion || "Candidato";
}

/** Extrae número de sueldo aspirado (RD$) para filtros y estadísticas */
export function parseSalary(value: unknown): number | null {
  if (value == null) return null;
  const s = String(value).replace(/[^\d.,]/g, "").replace(/,/g, "");
  const n = parseFloat(s);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function formatSalary(value: unknown): string {
  const n = parseSalary(value);
  if (n == null) return String(value ?? "—");
  return new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", maximumFractionDigits: 0 }).format(n);
}

export function salaryBucket(value: unknown): string {
  const n = parseSalary(value);
  if (n == null) return "Sin dato";
  if (n < 15000) return "Menos de RD$15,000";
  if (n < 20000) return "RD$15,000 – 19,999";
  if (n < 25000) return "RD$20,000 – 24,999";
  if (n < 30000) return "RD$25,000 – 29,999";
  return "RD$30,000+";
}

export function getPhotoFilename(files: SubmissionFiles): string | null {
  return files.foto ?? files.photo ?? files.imagen ?? null;
}

export function getCvFilename(files: SubmissionFiles): string | null {
  return files.curriculum ?? files.cv ?? files.resume ?? null;
}

export function isImageFilename(name: string): boolean {
  return /\.(jpe?g|png|gif|webp)$/i.test(name);
}

export function isPdfFilename(name: string): boolean {
  return /\.pdf$/i.test(name);
}

export function matchesSearch(data: SubmissionData, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.toLowerCase();
  const haystack = [
    data.area_aplicar,
    data.nombre,
    data.apellido,
    data.cedula,
    data.correo,
    data.celular,
    data.oficio_profesion,
    data.experiencia,
    data.sector,
    data.ciudad,
    data.provincia,
    data.rubros_laborales,
    data.sectores_experiencia,
    data.direccion,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

export const FIELD_LABELS: Record<string, string> = {
  area_aplicar: "Área a aplicar",
  nombre: "Nombre",
  apellido: "Apellido",
  cedula: "Cédula",
  fecha_nacimiento: "Fecha de nacimiento",
  lugar_nacimiento: "Lugar de nacimiento",
  nacionalidad: "Nacionalidad",
  sexo: "Sexo",
  estado_civil: "Estado civil",
  direccion: "Dirección",
  provincia: "Provincia",
  ciudad: "Ciudad",
  sector: "Sector / Barrio",
  rubros_laborales: "Rubros laborales",
  sectores_experiencia: "Rubros laborales",
  habilidades: "Habilidades",
  red_profesional: "Red profesional",
  linkedin_url: "Red profesional",
  celular: "Celular",
  correo: "Correo",
  oficio_profesion: "Oficio / Profesión",
  sueldo_aspirado: "Sueldo aspirado",
  tel_casa: "Teléfono casa",
  familiares: "Familiares",
  primaria: "Primaria",
  secundaria: "Secundaria",
  universitaria: "Universitaria",
  diplomado: "Diplomado",
  especialidad: "Especialidad",
  maestria: "Maestría",
  doctorado: "Doctorado",
  experiencia: "Experiencia laboral",
  estudia_actualmente: "Estudia actualmente",
  dia_clases: "Días de clases",
  trabajando_actualmente: "Trabajando actualmente",
  razon_dejar_empleo: "Razón de dejar empleo",
  tiempo_disponible: "Tiempo disponible",
  familiar_empresa: "Familiar en la empresa",
  recomendado: "Recomendado por",
  licencia_conducir: "Licencia de conducir",
  vehiculo: "Vehículo",
  enfermedad: "Enfermedad",
  cual_enfermedad: "Cuál enfermedad",
  religion: "Religión",
  practica_deporte: "Practica deporte",
  cual_deporte: "Cuál deporte",
};

export function getCandidateLocation(data: SubmissionData): string {
  return formatLocation({
    provincia: data.provincia,
    ciudad: data.ciudad,
    sector: data.sector,
    direccion: data.direccion,
  });
}

export function getRubros(data: SubmissionData): string[] {
  const raw = String(data.rubros_laborales ?? data.sectores_experiencia ?? "").trim();
  if (!raw) return [];
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

/** @deprecated use getRubros */
export function getSectores(data: SubmissionData): string[] {
  return getRubros(data);
}

export function groupFields(data: SubmissionData) {
  const groups: { title: string; keys: string[] }[] = [
    {
      title: "Información personal",
      keys: [
        "nombre",
        "apellido",
        "cedula",
        "fecha_nacimiento",
        "lugar_nacimiento",
        "nacionalidad",
        "sexo",
        "estado_civil",
        "direccion",
        "sector",
        "provincia",
        "ciudad",
        "celular",
        "correo",
        "tel_casa",
      ],
    },
    {
      title: "Perfil profesional",
      keys: [
        "area_aplicar",
        "oficio_profesion",
        "rubros_laborales",
        "sectores_experiencia",
        "habilidades",
        "red_profesional",
        "linkedin_url",
        "sueldo_aspirado",
        "experiencia",
        "trabajando_actualmente",
        "razon_dejar_empleo",
        "tiempo_disponible",
      ],
    },
    {
      title: "Formación académica",
      keys: [
        "primaria",
        "secundaria",
        "universitaria",
        "diplomado",
        "especialidad",
        "maestria",
        "doctorado",
        "estudia_actualmente",
        "dia_clases",
      ],
    },
    {
      title: "Información adicional",
      keys: [
        "familiares",
        "familiar_empresa",
        "recomendado",
        "licencia_conducir",
        "vehiculo",
        "enfermedad",
        "cual_enfermedad",
        "religion",
        "practica_deporte",
        "cual_deporte",
      ],
    },
  ];

  return groups
    .map((group) => ({
      title: group.title,
      fields: group.keys
        .filter((key) => !key.startsWith("_") && data[key] != null && String(data[key]).trim() !== "")
        .map((key) => ({
          key,
          label: FIELD_LABELS[key] ?? key.replace(/_/g, " "),
          value:
            key === "experiencia"
              ? formatWorkExperienceDisplay(String(data[key])) || String(data[key])
              : String(data[key]),
        })),
    }))
    .filter((group) => group.fields.length > 0);
}
