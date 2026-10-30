import { NextRequest, NextResponse } from "next/server";
import { checkAdminRequest } from "@/lib/admin-security";
import { ConflictError, readSite, ValidationError, writeSite } from "@/lib/admin-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MAX = 2 * 1024 * 1024;

export async function GET(req: NextRequest) {
  const check = checkAdminRequest(req);
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });
  return NextResponse.json(await readSite());
}

export async function POST(req: NextRequest) {
  const check = checkAdminRequest(req);
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });
  const text = await req.text();
  if (text.length > MAX) return NextResponse.json({ error: "Data terlalu besar (maks. 2 MB)" }, { status: 413 });
  let body: { data?: unknown; baseRevision?: string; force?: boolean };
  try { body = JSON.parse(text); } catch { return NextResponse.json({ error: "JSON tidak valid" }, { status: 400 }); }
  try {
    const result = await writeSite(body.data, body.baseRevision, body.force === true);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    if (e instanceof ConflictError) return NextResponse.json({ error: e.message }, { status: 409 });
    if (e instanceof ValidationError) return NextResponse.json({ error: "Validasi gagal", details: e.details }, { status: 400 });
    console.error("[admin] gagal menyimpan site.json", e);
    return NextResponse.json({ error: "Gagal menyimpan: " + (e instanceof Error ? e.message : "kesalahan tak dikenal") }, { status: 500 });
  }
}
