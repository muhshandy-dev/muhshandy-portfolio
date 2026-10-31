import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { checkAdminRequest } from "@/lib/admin-security";
import { detectUpload, safeUploadName, UPLOAD_MAX_BYTES } from "@/lib/upload-detect";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MAX_BYTES = UPLOAD_MAX_BYTES;

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
    const ext = detectUpload(bytes);
    if (!ext) return NextResponse.json({ error: "Format tidak didukung. Gunakan PNG, JPG, WebP, GIF, ICO, atau PDF (SVG ditolak demi keamanan)." }, { status: 415 });
    const filename = safeUploadName(file.name, ext, randomUUID().slice(0, 8));
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), bytes, { flag: "wx" });
    return NextResponse.json({ url: `/uploads/${filename}`, size: bytes.length, type: ext });
  } catch (e) {
    console.error("[admin] upload gagal", e);
    return NextResponse.json({ error: "Upload gagal" }, { status: 500 });
  }
}
