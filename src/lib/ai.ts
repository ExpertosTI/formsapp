import type { SubmissionData } from "./candidate";
import { getCandidateName } from "./candidate";

export interface AiInsight {
  summary: string;
  highlights: string[];
  suggestedStatus?: string;
  source: "ai" | "heuristic";
}

function heuristicInsight(data: SubmissionData): AiInsight {
  const name = getCandidateName(data);
  const exp = String(data.experiencia ?? "").trim();
  const oficio = String(data.oficio_profesion ?? "").trim();
  const disponible = String(data.tiempo_disponible ?? "").trim();
  const estudia = String(data.estudia_actualmente ?? "").toLowerCase();

  const highlights: string[] = [];
  if (oficio) highlights.push(`Perfil: ${oficio}`);
  if (disponible) highlights.push(`Disponibilidad: ${disponible}`);
  if (exp.length > 20) {
    const snippet = exp.length > 120 ? `${exp.slice(0, 120)}…` : exp;
    highlights.push(`Experiencia: ${snippet}`);
  }
  if (estudia === "sí" || estudia === "si") highlights.push("Estudia actualmente");

  let suggestedStatus = "nuevo";
  if (exp.length > 80 && disponible.toLowerCase().includes("inmediat")) {
    suggestedStatus = "revisado";
  }

  const summary =
    highlights.length > 0
      ? `${name} — ${highlights.slice(0, 2).join(". ")}.`
      : `${name} — candidato registrado. Revisa el perfil completo para más detalle.`;

  return { summary, highlights: highlights.slice(0, 4), suggestedStatus, source: "heuristic" };
}

async function geminiInsight(data: SubmissionData): Promise<AiInsight | null> {
  const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!key) return null;

  const prompt = `Eres asistente de RRHH. Resume en español (máx 2 frases) este candidato. Devuelve SOLO JSON: {"summary":"...","highlights":["...","..."],"suggestedStatus":"nuevo|revisado|entrevista"}

Datos:
${JSON.stringify(data, null, 0).slice(0, 3000)}`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 256 },
        }),
      }
    );
    if (!res.ok) return null;
    const json = await res.json();
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]) as {
      summary?: string;
      highlights?: string[];
      suggestedStatus?: string;
    };
    return {
      summary: parsed.summary ?? heuristicInsight(data).summary,
      highlights: parsed.highlights ?? [],
      suggestedStatus: parsed.suggestedStatus,
      source: "ai",
    };
  } catch {
    return null;
  }
}

export async function getCandidateInsight(data: SubmissionData): Promise<AiInsight> {
  const ai = await geminiInsight(data);
  if (ai) return ai;
  return heuristicInsight(data);
}

export function dashboardHeuristicInsights(stats: {
  totalCandidates: number;
  newCount: number;
  tenantCount: number;
  topTenant?: string;
}): string[] {
  const tips: string[] = [];
  if (stats.newCount > 0) {
    tips.push(`${stats.newCount} candidatos nuevos pendientes de revisión.`);
  }
  if (stats.topTenant) {
    tips.push(`${stats.topTenant} concentra la mayor actividad reciente.`);
  }
  tips.push(`${stats.totalCandidates} perfiles en ${stats.tenantCount} empresas — datos sincronizados.`);
  return tips.slice(0, 3);
}
