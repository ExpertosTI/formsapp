import { existsSync, readFileSync } from "fs";
import path from "path";

/**
 * Evolution API (WhatsApp) — compatible con variables globales y archivos locales (.evolution.local).
 */
export interface EvoCreds {
  url: string;
  key: string;
  source: string;
}

const DEFAULT_API_URL = "https://evoapi.renace.tech";

function env(name: string, fallback = ""): string {
  const raw = process.env[name] ?? fallback;
  return String(raw).trim().replace(/^["']|["']$/g, "");
}

function isPlausibleKey(key: string): boolean {
  if (!key || key.length < 20) return false;
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
    const key = kv.EVOLUTION_API_KEY || kv.EVO_API_KEY || kv.AUTHENTICATION_API_KEY || "";
    const url = (kv.EVOLUTION_API_URL || kv.EVO_API_URL || DEFAULT_API_URL).replace(/\/$/, "");
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
    env("WHATSAPP_API_KEY") ||
    env("AUTHENTICATION_API_KEY") ||
    env("EVOLUTION_API_TOKEN");

  const url = (
    env("EVOLUTION_API_URL") ||
    env("EVO_API_URL") ||
    env("WHATSAPP_API_URL") ||
    DEFAULT_API_URL
  ).replace(/\/$/, "");

  if (isPlausibleKey(key)) {
    cachedCreds = { url, key, source: "env" };
    return cachedCreds;
  }

  const candidates = [
    path.join(process.cwd(), ".evolution.local"),
    "/opt/zuv/.evolution.local",
    "/opt/citas/.evolution.local",
  ];

  for (const file of candidates) {
    const fromFile = readEvoFile(file);
    if (fromFile) {
      cachedCreds = fromFile;
      return cachedCreds;
    }
  }

  return null;
}

export function whatsappConfigured(): boolean {
  return Boolean(resolveEvoCreds());
}

export function tenantInstanceName(slug: string): string {
  const clean = String(slug || "empresa")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 30);

  return `forms-${clean || "empresa"}`;
}
