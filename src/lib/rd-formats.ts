/**
 * Formatos oficiales República Dominicana (cédula electoral y teléfonos).
 *
 * CÉDULA (11 dígitos): XXX-XXXXXXX-X
 *   · 3 primeros: código del municipio donde se emitió (001–402; 402 = extranjeros)
 *   · 7 siguientes: número secuencial del folio
 *   · 1 último: dígito verificador impreso en la cédula
 *   Ejemplo real: 402-0057193-9
 *
 * CELULAR (10 dígitos): (8XX) XXX-XXXX
 *   · Indicativos móviles: 809, 829, 849
 *   Ejemplo: (809) 555-1234
 *
 * TELÉFONO FIJO (opcional):
 *   · 7 dígitos locales: XXX-XXXX  (ej. 555-1234)
 *   · o 10 con indicativo: (809) 555-1234
 */

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/** Máscara visual: XXX-XXXXXXX-X */
export function formatCedula(value: string): string {
  const d = digitsOnly(value).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 10) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 10)}-${d.slice(10)}`;
}

/** Móvil RD: (8XX) XXX-XXXX — máx. 10 dígitos */
export function formatPhoneMobile(value: string): string {
  const d = digitsOnly(value).slice(0, 10);
  if (d.length === 0) return "";
  if (d.length <= 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

/** Fijo RD: XXX-XXXX (7) o (8XX) XXX-XXXX (10) */
export function formatPhoneLandline(value: string): string {
  const d = digitsOnly(value).slice(0, 10);
  if (d.length === 0) return "";
  if (d.length <= 7) {
    if (d.length <= 3) return d;
    return `${d.slice(0, 3)}-${d.slice(3)}`;
  }
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

const MOBILE_CODES = ["809", "829", "849"] as const;

/** Solo verifica que tenga 11 dígitos (formato completo). No bloquea por dígito verificador. */
export function isValidCedulaFormat(value: string): boolean {
  const d = digitsOnly(value);
  return d.length === 11 && /^\d{11}$/.test(d);
}

export function isValidPhoneMobile(value: string): boolean {
  const d = digitsOnly(value);
  return d.length === 10 && MOBILE_CODES.includes(d.slice(0, 3) as (typeof MOBILE_CODES)[number]);
}

export function isValidPhoneLandline(value: string): boolean {
  const d = digitsOnly(value);
  if (d.length === 7) return true;
  if (d.length === 10) return MOBILE_CODES.includes(d.slice(0, 3) as (typeof MOBILE_CODES)[number]);
  return false;
}

export type RdFieldMask = "cedula" | "phone-mobile" | "phone-landline";

export function maskForField(key: string): RdFieldMask | null {
  if (key === "cedula") return "cedula";
  if (key === "celular") return "phone-mobile";
  if (key === "tel_casa") return "phone-landline";
  return null;
}

export const RD_FIELD_HINTS: Record<string, string> = {
  cedula:
    "Tal como aparece en tu cédula: 11 dígitos (municipio · folio · verificador). Ej. 402-1234567-8",
  celular: "Móvil de 10 dígitos — indicativo 809, 829 o 849. Ej. (809) 555-1234",
  tel_casa: "Opcional. Fijo local 555-1234 o con indicativo (809) 555-1234",
};
