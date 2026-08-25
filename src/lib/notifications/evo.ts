import { existsSync, readFileSync } from "fs";
import path from "path";

/**
 * Evolution API (WhatsApp) — Compatible con variables globales y archivos locales (.evolution.local).
 */
export interface EvoCreds {
  url: string;
  key: string;
  source: string;
}

const DEFAULT_API_URL = "https://evoapi.renace.tech";
const DEFAULT_API_KEY = "d66888ea1d791329a97c934ea14014dc41c53e001440f74a";

function env(name: string, fallback = ""): string {
  const raw = process.env[name] ?? fallback;
  return String(raw).trim().replace(/^["']|["']$/g, "");
}

function isPlausibleKey(key: string): boolean {
  if (!key || key.length < 16) return false;
  const u = key.toUpperCase();
  if (u === "RENACE.TECH" || u.includes("CHANGE") || u.includes("YOUR_") || u === "RENAME") {
    return false;
  }
  return true;
}

function readEvoFile(filePath: string): EvoCreds | null {
  try {
    if (!existsSync(filePath)) return null;
    const raw = readFileSync(filePath, "utf8");
    const kv: Record<string, string> = {};
    for (const line of raw.split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#") || !t.includes("=")) continue;
      const i = t.indexOf("=");
      const k = t.slice(0, i).trim();
      let v = t.slice(i + 1).trim();
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1);
      }
      kv[k] = v;
    }
    const key =
      kv.EVOLUTION_API_KEY ||
      kv.EVO_API_KEY ||
      kv.AUTHENTICATION_API_KEY ||
      kv.GLOBAL_API_KEY ||
      "";
    const url = (
      kv.EVOLUTION_API_URL ||
      kv.EVO_API_URL ||
      kv.SERVER_URL ||
      DEFAULT_API_URL
    ).replace(/\/$/, "");
    if (!isPlausibleKey(key)) return null;
    return { url, key, source: filePath };
  } catch {
    return null;
  }
}

let cachedCreds: EvoCreds | null = null;

export function resolveEvoCreds(): EvoCreds | null {
  if (cachedCreds) return cachedCreds;

  const key =
    env("EVOLUTION_API_KEY") ||
    env("EVO_API_KEY") ||
    env("AUTHENTICATION_API_KEY") ||
    env("GLOBAL_API_KEY") ||
    env("WHATSAPP_API_KEY") ||
    env("EVOLUTION_API_TOKEN");

  const url = (
    env("EVOLUTION_API_URL") ||
    env("EVO_API_URL") ||
    env("SERVER_URL") ||
    env("WHATSAPP_API_URL") ||
    DEFAULT_API_URL
  ).replace(/\/$/, "");

  if (isPlausibleKey(key)) {
    cachedCreds = { url, key, source: "env" };
    return cachedCreds;
  }

  const candidates = [
    path.join(process.cwd(), ".evolution.local"),
    path.join(process.cwd(), "data", ".evolution.local"),
    "/opt/talentolink/.evolution.local",
    "/opt/zuv/.evolution.local",
    "/opt/citas/.evolution.local",
    "/var/www/ecofast/.evolution.local",
    "/app/.evolution.local",
    "/root/.evolution.local",
  ];

  for (const file of candidates) {
    const fromFile = readEvoFile(file);
    if (fromFile) {
      cachedCreds = fromFile;
      return cachedCreds;
    }
  }

  // Fallback predeterminado a las credenciales globales del servidor
  if (isPlausibleKey(DEFAULT_API_KEY)) {
    cachedCreds = { url: DEFAULT_API_URL, key: DEFAULT_API_KEY, source: "default" };
    return cachedCreds;
  }

  return null;
}

export function evolutionApiUrl(): string {
  return resolveEvoCreds()?.url || env("EVOLUTION_API_URL", DEFAULT_API_URL).replace(/\/$/, "");
}

export function evolutionApiKey(): string {
  return resolveEvoCreds()?.key || DEFAULT_API_KEY;
}

export function whatsappConfigured(): boolean {
  return Boolean(resolveEvoCreds());
}

export function getWhatsAppConfigStatus() {
  const creds = resolveEvoCreds();
  if (!creds) {
    return { configured: false as const, reason: "EVOLUTION_API_KEY no disponible" };
  }
  return {
    configured: true as const,
    apiUrl: creds.url,
    source: creds.source,
  };
}

export function sanitizeInstancePart(raw: string): string {
  return String(raw || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 30);
}

const RESERVED_INSTANCES = new Set([
  "evolution",
  "admin",
  "master",
  "root",
  "default",
  "renace",
  "altamar",
  "odoo",
  "citas",
  "zuv",
  "zav",
]);

export function isSafeTenantInstance(name: string): boolean {
  const n = String(name || "").trim();
  if (!n || n.length > 60) return false;
  const lower = n.toLowerCase();
  if (RESERVED_INSTANCES.has(lower)) return false;
  if (/^(renace|altamar|odoo|zuv|zav|citas)([_-]|$)/i.test(lower)) return false;
  return /^[a-z][a-z0-9_-]{0,59}$/i.test(n);
}

export function tenantInstanceName(slug: string, tenantId?: string): string {
  const fromSlug = sanitizeInstancePart(slug || "empresa");
  const client = fromSlug || "empresa";
  const tail = sanitizeInstancePart(String(tenantId || "")).slice(-4) || "x";
  return `app-forms-${client.slice(0, 20)}-${tail}`.slice(0, 50);
}
