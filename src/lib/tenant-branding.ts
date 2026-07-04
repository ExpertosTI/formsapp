const HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function isHexColor(value: string): boolean {
  return HEX.test(value.trim());
}

/**
 * URL pública del logo.
 * En producción (standalone + volumen Docker) `/uploads/...` no sirve archivos
 * escritos en runtime; se entregan por `/api/files/...` igual que CVs/fotos.
 */
export function logoPublicUrl(
  logo: string | null | undefined,
  tenantSlug?: string | null
): string | null {
  if (!logo) return null;
  const trimmed = logo.trim();
  if (!trimmed) return null;
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("data:")
  ) {
    return trimmed;
  }
  if (trimmed.startsWith("/api/")) return trimmed;

  // DB: "uploads/logos/x.png" | "logos/x.png" | legacy "images/logo.jpeg"
  const relative = trimmed.replace(/^\/+/, "").replace(/^uploads\//, "");
  if (!relative) return null;

  const slug = (tenantSlug || "brand").replace(/[^a-zA-Z0-9_-]/g, "") || "brand";
  const encoded = relative.split("/").filter(Boolean).map(encodeURIComponent).join("/");
  return `/api/files/${encodeURIComponent(slug)}/${encoded}`;
}
