/** Cuenta dueño: desbloquea Super Admin oculto en la app nativa. */
export const OWNER_UNLOCK_EMAIL = "expertostird@gmail.com";

export const OPS_STORAGE_KEY = "tl_ops_unlock";

export function isOwnerEmail(email: string | null | undefined): boolean {
  return String(email ?? "").trim().toLowerCase() === OWNER_UNLOCK_EMAIL;
}

export function isNativeApp(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
    if (cap?.isNativePlatform?.()) return true;
  } catch {
    /* ignore */
  }
  return document.documentElement.classList.contains("tl-native");
}
