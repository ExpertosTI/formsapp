export type SubmissionData = Record<string, string | number | boolean | null | undefined>;
export type SubmissionFiles = Record<string, string>;

export const STATUS_LABELS: Record<string, string> = {
  nuevo: "Nuevo",
  revisado: "Revisado",
  entrevista: "Entrevista",
  contratado: "Contratado",
  archivado: "Archivado",
};

export const STATUS_COLORS: Record<string, string> = {
  nuevo: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  revisado: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  entrevista: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  contratado: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  archivado: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

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
  return (
    String(data.oficio_profesion ?? data.especialidad ?? "").trim() ||
    "Candidato"
  );
}

export function matchesSearch(data: SubmissionData, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.toLowerCase();
  const haystack = [
    data.nombre,
    data.apellido,
    data.cedula,
    data.correo,
    data.celular,
    data.oficio_profesion,
    data.experiencia,
    data.direccion,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

export const FIELD_LABELS: Record<string, string> = {
  nombre: "Nombre",
  apellido: "Apellido",
  cedula: "Cédula",
  fecha_nacimiento: "Fecha de nacimiento",
  lugar_nacimiento: "Lugar de nacimiento",
  nacionalidad: "Nacionalidad",
  sexo: "Sexo",
  estado_civil: "Estado civil",
  direccion: "Dirección",
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
        "celular",
        "correo",
        "tel_casa",
      ],
    },
    {
      title: "Perfil profesional",
      keys: [
        "oficio_profesion",
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
        .filter((key) => data[key] != null && String(data[key]).trim() !== "")
        .map((key) => ({
          key,
          label: FIELD_LABELS[key] ?? key.replace(/_/g, " "),
          value: String(data[key]),
        })),
    }))
    .filter((group) => group.fields.length > 0);
}
