import { randomBytes, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

/*
 * Admin hanya untuk server development di laptop sendiri. Lapisan perlindungan:
 * 1. Tidak aktif di production (NODE_ENV) — /admin dan /api/admin mengembalikan 404.
 * 2. Script `pnpm dev` mengikat server ke 127.0.0.1, jadi perangkat lain di jaringan tidak bisa terhubung.
 * 3. Header Host dan Origin harus localhost (mencegah DNS rebinding dan permintaan lintas situs).
 * 4. Setiap request API wajib membawa token acak per proses server yang hanya ada di halaman /admin
 *    (situs lain tidak bisa membacanya karena same-origin policy).
 */
const LOCAL = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);
const g = globalThis as typeof globalThis & { __portfolioAdminToken?: string };

export function adminToken() {
  g.__portfolioAdminToken ??= randomBytes(24).toString("base64url");
  return g.__portfolioAdminToken;
}

export const adminEnabled = () => process.env.NODE_ENV === "development";

function hostname(value: string | null) {
  if (!value) return "";
  if (value.startsWith("[")) return value.slice(0, value.indexOf("]") + 1);
  return value.split(":")[0];
}

export function checkAdminRequest(req: NextRequest): { ok: true } | { ok: false; status: number; error: string } {
  if (!adminEnabled()) return { ok: false, status: 404, error: "Not found" };
  const host = hostname(req.headers.get("host"));
  if (!LOCAL.has(host) || !LOCAL.has(req.nextUrl.hostname)) return { ok: false, status: 403, error: "Admin hanya bisa diakses dari localhost" };
  // Catatan: Next.js sendiri menambahkan header x-forwarded-*, jadi header itu tidak bisa dipakai untuk menolak proxy.
  const fwdHost = hostname(req.headers.get("x-forwarded-host"));
  if (fwdHost && !LOCAL.has(fwdHost)) return { ok: false, status: 403, error: "Admin hanya bisa diakses dari localhost" };
  const origin = req.headers.get("origin");
  if (origin) {
    try { if (new URL(origin).host !== req.headers.get("host")) return { ok: false, status: 403, error: "Origin tidak diizinkan" }; }
    catch { return { ok: false, status: 403, error: "Origin tidak valid" }; }
  }
  const site = req.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") return { ok: false, status: 403, error: "Permintaan lintas situs ditolak" };
  const sent = Buffer.from(req.headers.get("x-admin-token") ?? "");
  const expected = Buffer.from(adminToken());
  if (sent.length !== expected.length || !timingSafeEqual(sent, expected)) return { ok: false, status: 401, error: "Token admin tidak valid. Muat ulang halaman /admin." };
  return { ok: true };
}
