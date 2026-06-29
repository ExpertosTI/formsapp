import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const ECOFAST = process.env.ECOFAST_BASE || "/var/www/ecofast";
const UPLOADS = path.join(process.cwd(), "public", "uploads");

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tenant: string; path: string[] }> }
) {
  const { tenant, path: segments } = await params;
  const filename = segments.map(decodeURIComponent).join("/");

  const candidates = [
    path.join(UPLOADS, filename),
    path.join(ECOFAST, "tenants", tenant, "uploads", filename),
  ];

  for (const filePath of candidates) {
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const buf = fs.readFileSync(filePath);
      const ext = path.extname(filename).toLowerCase();
      const type =
        ext === ".pdf"
          ? "application/pdf"
          : ext.match(/\.(jpe?g|png|gif|webp)$/)
            ? `image/${ext.replace(".", "")}`
            : "application/octet-stream";
      return new NextResponse(buf, {
        headers: {
          "Content-Type": type,
          "Cache-Control": "public, max-age=86400",
        },
      });
    }
  }

  return NextResponse.json({ error: "File not found" }, { status: 404 });
}
