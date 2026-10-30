import { NextRequest, NextResponse } from "next/server";
import { writeFile, rename } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { isLocalAdmin } from "@/lib/admin-security";
import { siteSchema } from "@/lib/site-schema";

export const runtime = "nodejs";
const target = path.join(process.cwd(), "src", "data", "site.json");

export async function POST(req: NextRequest) {
  if (!isLocalAdmin(req)) return NextResponse.json({ error: "Local development only" }, { status: 404 });
  try {
    const text = await req.text();
    if (text.length > 1024 * 1024) return NextResponse.json({ error: "File is too large" }, { status: 413 });
    const parsed = siteSchema.safeParse(JSON.parse(text));
    if (!parsed.success) return NextResponse.json({ error: "Validation failed", details: parsed.error.issues.slice(0, 8).map((e) => `${e.path.join(".")}: ${e.message}`) }, { status: 400 });
    const temp = `${target}.${randomUUID()}.tmp`;
    await writeFile(temp, JSON.stringify(parsed.data, null, 2) + "\n", "utf8");
    await rename(temp, target);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Could not save" }, { status: 400 });
  }
}
