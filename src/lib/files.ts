/** Ruta pública de un archivo migrado (nombres planos con timestamp). */
export function uploadUrl(filename: string, tenantSlug?: string): string {
  if (!filename) return "#";
  if (filename.startsWith("http")) return filename;
  const clean = filename.replace(/^\/+/, "");
  if (tenantSlug) {
    return `/api/files/${tenantSlug}/${encodeURIComponent(clean)}`;
  }
  return `/uploads/${encodeURIComponent(clean)}`;
}
