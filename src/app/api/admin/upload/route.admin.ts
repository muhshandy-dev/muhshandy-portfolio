import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { checkAdminRequest } from "@/lib/admin-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MAX_BYTES = 8 * 1024 * 1024;

/** Tipe file dikenali dari isi (magic bytes), bukan dari nama. SVG/HTML ditolak (risiko XSS). */
function detect(bytes: Buffer): string | null {
  const at = (sig: number[], offset = 0) => sig.every((n, i) => bytes[offset + i] === n);
  if (at([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "png";
  if (at([0xff, 0xd8, 0xff])) return "jpg";
  if (bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") return "webp";
  if (bytes.toString("ascii", 0, 6) === "GIF87a" || bytes.toString("ascii", 0, 6) === "GIF89a") return "gif";
  if (at([0x00, 0x00, 0x01, 0x00]) && bytes.length > 6) return "ico";
  if (bytes.toString("ascii", 0, 5) === "%PDF-") return "pdf";
  return null;
}

export async function POST(req: NextRequest) {
  const check = checkAdminRequest(req);
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });
  if (Number(req.headers.get("content-length") || 0) > MAX_BYTES + 64_000) return NextResponse.json({ error: "Ukuran maksimal 8 MB" }, { status: 413 });
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File) || !file.size) return NextResponse.json({ error: "Pilih file terlebih dahulu" }, { status: 400 });
    if (file.size > MAX_BYTES) return NextResponse.json({ error: "Ukuran maksimal 8 MB" }, { status: 413 });
    const bytes = Buffer.from(await file.arrayBuffer());
    const ext = detect(bytes);
    if (!ext) return NextResponse.json({ error: "Format tidak didukung. Gunakan PNG, JPG, WebP, GIF, ICO, atau PDF (SVG ditolak demi keamanan)." }, { status: 415 });
    const base = path.parse(file.name).name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "file";
    const filename = `${base}-${randomUUID().slice(0, 8)}.${ext}`;
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), bytes, { flag: "wx" });
    return NextResponse.json({ url: `/uploads/${filename}`, size: bytes.length, type: ext });
  } catch (e) {
    console.error("[admin] upload gagal", e);
    return NextResponse.json({ error: "Upload gagal" }, { status: 500 });
  }
}
