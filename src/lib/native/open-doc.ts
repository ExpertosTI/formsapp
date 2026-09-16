/** OpenDoc — abre CVs y documentos con el visor nativo del dispositivo. */

function guessMime(name: string): string {
  const n = name.toLowerCase();
  if (n.endsWith(".pdf")) return "application/pdf";
  if (n.endsWith(".png")) return "image/png";
  if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
  if (n.endsWith(".webp")) return "image/webp";
  if (n.endsWith(".gif")) return "image/gif";
  if (n.endsWith(".doc")) return "application/msword";
  if (n.endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  if (n.endsWith(".odt")) return "application/vnd.oasis.opendocument.text";
  return "application/octet-stream";
}

export function absoluteUrl(url: string): string {
  if (!url || url === "#") return url;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (typeof window === "undefined") return url;
  return new URL(url, window.location.origin).href;
}

export async function isNativeApp(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const { Capacitor } = await import("@capacitor/core");
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export async function openDoc(
  url: string,
  opts?: { filename?: string; mimeType?: string }
): Promise<void> {
  const abs = absoluteUrl(url);
  if (!abs || abs === "#") return;

  const native = await isNativeApp();
  if (!native) {
    window.open(abs, "_blank", "noopener,noreferrer");
    return;
  }

  const { Filesystem, Directory } = await import("@capacitor/filesystem");
  const { FileOpener } = await import("@capacitor-community/file-opener");
  const rawName =
    opts?.filename ||
    decodeURIComponent(abs.split("?")[0].split("/").pop() || "") ||
    `documento-${Date.now()}.pdf`;
  const safeName = rawName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const mimeType = opts?.mimeType || guessMime(safeName);

  const downloaded = await Filesystem.downloadFile({
    url: abs,
    path: `opendoc/${Date.now()}-${safeName}`,
    directory: Directory.Cache,
  });

  const path = downloaded.path;
  if (!path) {
    throw new Error("No se pudo guardar el documento en el dispositivo");
  }

  await FileOpener.open({
    filePath: path,
    contentType: mimeType,
    openWithDefault: true,
  });
}

export async function shareDoc(url: string, title: string, text?: string): Promise<void> {
  const abs = absoluteUrl(url);
  const native = await isNativeApp();

  if (native) {
    const { Share } = await import("@capacitor/share");
    await Share.share({
      title,
      text: text || title,
      url: abs,
      dialogTitle: title,
    });
    return;
  }

  if (typeof navigator !== "undefined" && navigator.share) {
    await navigator.share({ title, text: text || title, url: abs });
    return;
  }

  window.open(abs, "_blank", "noopener,noreferrer");
}

export async function shareText(title: string, text: string, url?: string): Promise<void> {
  const native = await isNativeApp();
  if (native) {
    const { Share } = await import("@capacitor/share");
    await Share.share({ title, text, url, dialogTitle: title });
    return;
  }
  if (typeof navigator !== "undefined" && navigator.share) {
    await navigator.share({ title, text, url });
    return;
  }
}

export async function hapticImpact(style: "light" | "medium" | "heavy" = "light"): Promise<void> {
  if (!(await isNativeApp())) return;
  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    const map = {
      light: ImpactStyle.Light,
      medium: ImpactStyle.Medium,
      heavy: ImpactStyle.Heavy,
    };
    await Haptics.impact({ style: map[style] });
  } catch {
    /* web / plugin missing */
  }
}

export async function takeNativePhoto(filename = "foto.jpg"): Promise<File | null> {
  if (!(await isNativeApp())) return null;
  const { Camera, CameraResultType, CameraSource } = await import("@capacitor/camera");
  const photo = await Camera.getPhoto({
    quality: 85,
    resultType: CameraResultType.Base64,
    source: CameraSource.Prompt,
    correctOrientation: true,
    width: 1600,
  });
  if (!photo.base64String) return null;
  const mime = photo.format === "png" ? "image/png" : "image/jpeg";
  const binary = atob(photo.base64String);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const ext = photo.format === "png" ? "png" : "jpg";
  return new File([bytes], filename.replace(/\.[^.]+$/, "") + `.${ext}`, { type: mime });
}
