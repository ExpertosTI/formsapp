import type { SubmissionData } from "./candidate";
import { suggestPositions } from "./ai";

export interface FormTelemetry {
  startedAt: number;
  submittedAt: number;
  durationMs: number;
  fieldFocusCount: number;
  stepCount: number;
  fieldsFilled: number;
  fieldsTotal: number;
}

export interface ScoreDimension {
  key: string;
  label: string;
  score: number;
  max: number;
}

export interface CandidateScore {
  overall: number;
  grade: "A" | "B" | "C" | "D" | "F";
  dimensions: ScoreDimension[];
  flags: string[];
  tips: string[];
  positions: string[];
  telemetry?: FormTelemetry;
}

const TEXT_FIELDS = [
  "nombre",
  "apellido",
  "experiencia",
  "oficio_profesion",
  "direccion",
  "razon_dejar_empleo",
  "especialidad",
];

function clamp(n: number, min = 0, max = 100) {
  return Math.round(Math.max(min, Math.min(max, n)));
}

function hasExcessiveUppercase(text: string): boolean {
  const words = text.split(/\s+/).filter((w) => w.length > 2);
  if (!words.length) return false;
  const upper = words.filter((w) => w === w.toUpperCase() && /[A-ZÁÉÍÓÚÑ]/.test(w));
  return upper.length / words.length > 0.4;
}

function writingQualityScore(data: SubmissionData): { score: number; flags: string[] } {
  const flags: string[] = [];
  let points = 100;

  for (const key of TEXT_FIELDS) {
    const raw = String(data[key] ?? "").trim();
    if (!raw) continue;

    if (hasExcessiveUppercase(raw)) {
      points -= 12;
      if (key === "nombre" || key === "apellido") {
        flags.push("Nombre/apellido con mayúsculas excesivas");
      } else {
        flags.push(`Mayúsculas excesivas en ${key.replace(/_/g, " ")}`);
      }
    }

    if (/(.)\1{3,}/.test(raw)) {
      points -= 8;
      flags.push("Caracteres repetidos detectados");
    }

    if (key === "experiencia" && raw.length > 0 && raw.length < 25) {
      points -= 15;
      flags.push("Experiencia laboral muy breve");
    }

    if (key === "experiencia" && !/[.!?]/.test(raw) && raw.length > 80) {
      points -= 5;
      flags.push("Experiencia sin puntuación clara");
    }
  }

  const correo = String(data.correo ?? "");
  if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    points -= 20;
    flags.push("Formato de correo inválido");
  }

  const cel = String(data.celular ?? "").replace(/\D/g, "");
  if (cel && (cel.length < 10 || cel.length > 11)) {
    points -= 10;
    flags.push("Número de celular incompleto");
  }

  return { score: clamp(points), flags: [...new Set(flags)] };
}

function professionalismScore(data: SubmissionData): { score: number; flags: string[] } {
  const flags: string[] = [];
  let points = 70;

  const nombre = String(data.nombre ?? "").trim();
  const apellido = String(data.apellido ?? "").trim();
  if (nombre && nombre === nombre.toLowerCase()) {
    points -= 8;
    flags.push("Nombre en minúsculas");
  }
  if (apellido && apellido === apellido.toLowerCase()) {
    points -= 8;
    flags.push("Apellido en minúsculas");
  }

  if (data.red_profesional && String(data.red_profesional).startsWith("http")) points += 6;
  if (data.linkedin_url && String(data.linkedin_url).includes("http")) points += 6;
  if (data.rubros_laborales && String(data.rubros_laborales).split(",").length >= 2) points += 8;
  if (data.sectores_experiencia && String(data.sectores_experiencia).split(",").length >= 2) points += 8;
  if (data.provincia && data.ciudad && data.sector) points += 10;
  if (data.habilidades && String(data.habilidades).length > 15) points += 6;

  const disp = String(data.tiempo_disponible ?? "").toLowerCase();
  if (disp.includes("inmediat")) points += 6;

  const trabaja = String(data.trabajando_actualmente ?? "").toLowerCase();
  if (trabaja === "no" && disp.includes("inmediat")) points += 4;

  return { score: clamp(points), flags };
}

function completenessScore(data: SubmissionData, telemetry?: FormTelemetry): number {
  const important = [
    "nombre",
    "apellido",
    "cedula",
    "correo",
    "celular",
    "oficio_profesion",
    "experiencia",
    "sueldo_aspirado",
    "tiempo_disponible",
    "provincia",
    "ciudad",
    "sector",
    "rubros_laborales",
  ];
  const filled = important.filter((k) => String(data[k] ?? "").trim()).length;
  let score = (filled / important.length) * 100;

  if (telemetry && telemetry.fieldsTotal > 0) {
    const ratio = telemetry.fieldsFilled / telemetry.fieldsTotal;
    score = score * 0.7 + ratio * 100 * 0.3;
  }

  return clamp(score);
}

function speedScore(telemetry?: FormTelemetry): { score: number; flags: string[] } {
  const flags: string[] = [];
  if (!telemetry) return { score: 75, flags };

  const sec = telemetry.durationMs / 1000;
  let score = 80;

  if (sec < 45) {
    score = 35;
    flags.push("Formulario completado muy rápido (< 45 s)");
  } else if (sec < 90) {
    score = 55;
    flags.push("Tiempo de llenado sospechosamente corto");
  } else if (sec <= 900) {
    score = 95;
  } else if (sec <= 1800) {
    score = 85;
  } else if (sec <= 3600) {
    score = 70;
  } else {
    score = 60;
    flags.push("Sesión muy larga (> 1 h)");
  }

  if (telemetry.fieldFocusCount > 0 && telemetry.fieldFocusCount < 5) {
    score -= 10;
    flags.push("Pocos campos editados");
  }

  return { score: clamp(score), flags };
}

function gradeFromScore(n: number): CandidateScore["grade"] {
  if (n >= 85) return "A";
  if (n >= 70) return "B";
  if (n >= 55) return "C";
  if (n >= 40) return "D";
  return "F";
}

export function computeCandidateScore(
  data: SubmissionData,
  telemetry?: FormTelemetry
): CandidateScore {
  const writing = writingQualityScore(data);
  const prof = professionalismScore(data);
  const complete = completenessScore(data, telemetry);
  const speed = speedScore(telemetry);

  const dimensions: ScoreDimension[] = [
    { key: "completeness", label: "Completitud", score: complete, max: 100 },
    { key: "writing", label: "Redacción", score: writing.score, max: 100 },
    { key: "professionalism", label: "Profesionalismo", score: prof.score, max: 100 },
    { key: "speed", label: "Velocidad", score: speed.score, max: 100 },
  ];

  const overall = clamp(
    complete * 0.35 + writing.score * 0.3 + prof.score * 0.2 + speed.score * 0.15
  );

  const flags = [...new Set([...writing.flags, ...prof.flags, ...speed.flags])];
  const positions = suggestPositions(data);

  const tips: string[] = [];
  if (overall >= 80) tips.push("Candidato sólido — priorizar para entrevista");
  else if (overall >= 65) tips.push("Perfil prometedor — revisar experiencia en detalle");
  else tips.push("Revisar banderas antes de avanzar");

  if (positions[0] && positions[0] !== "Evaluar perfil manualmente") {
    tips.push(`Encaja como: ${positions.slice(0, 2).join(", ")}`);
  }
  if (flags.length === 0) tips.push("Sin alertas de calidad en el llenado");

  return {
    overall,
    grade: gradeFromScore(overall),
    dimensions,
    flags,
    tips: tips.slice(0, 4),
    positions,
    telemetry,
  };
}

export function parseScoring(data: SubmissionData): CandidateScore | null {
  const raw = data._scoring;
  if (!raw) return null;
  if (typeof raw === "object") return raw as CandidateScore;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as CandidateScore;
    } catch {
      return null;
    }
  }
  return null;
}

export function getScoreColor(grade: string): string {
  switch (grade) {
    case "A":
      return "text-emerald-300 bg-emerald-500/20 border-emerald-500/30";
    case "B":
      return "text-teal-300 bg-teal-500/20 border-teal-500/30";
    case "C":
      return "text-amber-300 bg-amber-500/20 border-amber-500/30";
    case "D":
      return "text-orange-300 bg-orange-500/20 border-orange-500/30";
    default:
      return "text-red-300 bg-red-500/20 border-red-500/30";
  }
}
