/** Formato cédula dominicana: 000-0000000-0 */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function formatCedula(value: string): string {
  const d = digitsOnly(value).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 10) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 10)}-${d.slice(10)}`;
}

/** Formato teléfono RD: (809) 000-0000 */
export function formatPhoneRD(value: string): string {
  const d = digitsOnly(value).slice(0, 10);
  if (d.length === 0) return "";
  if (d.length <= 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

export function isValidCedula(value: string): boolean {
  const d = digitsOnly(value);
  if (d.length !== 11) return false;
  const weights = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2];
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    let n = parseInt(d[i], 10) * weights[i];
    if (n > 9) n = Math.floor(n / 10) + (n % 10);
    sum += n;
  }
  const check = (10 - (sum % 10)) % 10;
  return check === parseInt(d[10], 10);
}

export function isValidPhoneRD(value: string): boolean {
  const d = digitsOnly(value);
  if (d.length !== 10) return false;
  return ["809", "829", "849"].includes(d.slice(0, 3));
}

export function maskForField(key: string): "cedula" | "phone" | null {
  if (key === "cedula") return "cedula";
  if (key === "celular" || key === "tel_casa") return "phone";
  return null;
}
