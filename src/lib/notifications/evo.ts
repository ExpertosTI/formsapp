/**
 * Evolution API (WhatsApp) — compatible con variables ya usadas en el servidor.
 *
 * Soporta estos nombres (en orden de prioridad):
 *   URL:      EVOLUTION_API_URL | EVO_API_URL | WHATSAPP_API_URL
 *   API Key:  EVOLUTION_API_KEY | EVO_API_KEY | WHATSAPP_API_KEY | EVOLUTION_API_TOKEN
 *   Instancia: EVOLUTION_INSTANCE | EVO_INSTANCE | WHATSAPP_INSTANCE
 */

export interface EvoConfig {
  baseUrl: string;
  apiKey: string;
  instance: string;
}

export function getEvoConfig(): EvoConfig | null {
  const baseUrl = (
    process.env.EVOLUTION_API_URL ??
    process.env.EVO_API_URL ??
    process.env.WHATSAPP_API_URL ??
    ""
  )
    .trim()
    .replace(/\/$/, "");

  const apiKey = (
    process.env.EVOLUTION_API_KEY ??
    process.env.EVO_API_KEY ??
    process.env.WHATSAPP_API_KEY ??
    process.env.EVOLUTION_API_TOKEN ??
    ""
  ).trim();

  const instance = (
    process.env.EVOLUTION_INSTANCE ??
    process.env.EVO_INSTANCE ??
    process.env.WHATSAPP_INSTANCE ??
    ""
  ).trim();

  if (!baseUrl || !apiKey || !instance) return null;
  return { baseUrl, apiKey, instance };
}
