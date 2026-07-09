const MOBILE_PREFIXES = ["809", "829", "849"];

/** Número E.164 para WhatsApp RD: +18095551234 */
export function normalizeWhatsAppPhone(raw: unknown): string | null {
  let d = String(raw ?? "").replace(/\D/g, "");
  if (d.startsWith("1") && d.length === 11) d = d.slice(1);
  if (d.length !== 10) return null;
  if (!MOBILE_PREFIXES.includes(d.slice(0, 3))) return null;
  return `+1${d}`;
}

export function whatsAppClickUrl(phoneE164: string, message: string): string {
  const digits = phoneE164.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
