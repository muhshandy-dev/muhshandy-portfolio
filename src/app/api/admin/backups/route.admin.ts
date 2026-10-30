import { NextRequest, NextResponse } from "next/server";
import { checkAdminRequest } from "@/lib/admin-security";
import { listBackups, readBackup } from "@/lib/admin-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const check = checkAdminRequest(req);
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });
  const name = req.nextUrl.searchParams.get("name");
  try {
    if (name) return NextResponse.json({ data: await readBackup(name) });
    return NextResponse.json({ backups: await listBackups() });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Gagal" }, { status: 404 });
  }
}
