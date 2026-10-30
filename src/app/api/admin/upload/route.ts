import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { isLocalAdmin } from "@/lib/admin-security";

export const runtime = "nodejs";
const MAX_BYTES = 8 * 1024 * 1024;

export async function POST(req: NextRequest) {
  if (!isLocalAdmin(req)) return NextResponse.json({ error: "Local development only" }, { status: 404 });
  if (Number(req.headers.get("content-length") || 0) > MAX_BYTES + 20000) return NextResponse.json({ error: "Max 8 MiB" }, { status: 413 });
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File) || !file.size || file.size > MAX_BYTES) return NextResponse.json({ error: "Choose a file smaller than 8 MiB" }, { status: 400 });
    const bytes = Buffer.from(await file.arrayBuffer());
    const check = (sig: number[], offset = 0) => sig.every((n, i) => bytes[offset + i] === n);
    let ext = "";
    if (check([0x89, 0x50, 0x4e, 0x47])) ext = "png";
    else if (check([0xff, 0xd8, 0xff])) ext = "jpg";
    else if (bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") ext = "webp";
    else if (bytes.toString("ascii", 0, 5) === "%PDF-") ext = "pdf";
    if (!ext) return NextResponse.json({ error: "Only PNG, JPG, WebP, or PDF supported" }, { status: 400 });
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    const filename = `${randomUUID()}.${ext}`;
    await writeFile(path.join(dir, filename), bytes, { flag: "wx" });
    return NextResponse.json({ url: `/uploads/${filename}` });
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 400 });
  }
}
