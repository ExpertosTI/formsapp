import fs from "fs";
import path from "path";

export const LOGOS_DIR = path.join(process.cwd(), "public", "uploads", "logos");
export const ALLOWED_LOGO_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
export const MAX_LOGO_BYTES = 2 * 1024 * 1024;

export function deleteManagedLogo(logoPath: string | null | undefined) {
  if (!logoPath || !logoPath.startsWith("uploads/logos/")) return;
  const full = path.join(process.cwd(), "public", logoPath);
  if (fs.existsSync(full) && fs.statSync(full).isFile()) {
    try {
      fs.unlinkSync(full);
    } catch {
      /* ignore */
    }
  }
}

export async function saveLogo(file: File, slug: string): Promise<string> {
  if (!ALLOWED_LOGO_TYPES.has(file.type)) {
    throw new Error("Logo debe ser JPG, PNG, WEBP o GIF");
  }
  if (file.size > MAX_LOGO_BYTES) {
    throw new Error("Logo máximo 2 MB");
  }

  const ext =
    file.type === "image/png"
      ? ".png"
      : file.type === "image/webp"
        ? ".webp"
        : file.type === "image/gif"
          ? ".gif"
          : ".jpg";

  fs.mkdirSync(LOGOS_DIR, { recursive: true });
  const filename = `${slug}_${Date.now().toString(36)}${ext}`;
  const dest = path.join(LOGOS_DIR, filename);
  const buf = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(dest, buf);
  return `uploads/logos/${filename}`;
}
