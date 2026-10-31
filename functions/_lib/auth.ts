import type { Env } from "./http.ts";

export const SESSION_COOKIE = "admin_session";
export const SESSION_TTL_SECONDS = 8 * 60 * 60;
export const MIN_PASSWORD_LENGTH = 12;

const enc = new TextEncoder();

/** Kembalikan pesan bila konfigurasi belum aman/lengkap. Admin tertutup sampai ini beres (fail closed). */
export function configProblem(env: Env): string | null {
  if (!env.ADMIN_PASSWORD) return "Admin online belum aktif: variabel ADMIN_PASSWORD belum diisi di Cloudflare Pages.";
  if (env.ADMIN_PASSWORD.length < MIN_PASSWORD_LENGTH) return `Admin online belum aktif: ADMIN_PASSWORD minimal ${MIN_PASSWORD_LENGTH} karakter.`;
  if (!env.GITHUB_TOKEN) return "Admin online belum aktif: variabel GITHUB_TOKEN belum diisi di Cloudflare Pages.";
  return null;
}

const toB64Url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
function fromB64Url(text: string) {
  const padded = text.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (text.length % 4)) % 4);
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

async function sha256(text: string) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(text)));
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array) {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return diff === 0;
}

/** Bandingkan hash SHA-256 kedua sisi (panjang sama, waktu konstan). */
export async function passwordMatches(env: Env, attempt: string) {
  if (configProblem(env)) return false;
  return constantTimeEqual(await sha256(attempt), await sha256(env.ADMIN_PASSWORD ?? ""));
}

/** Kunci tanda tangan sesi diturunkan dari GITHUB_TOKEN + ADMIN_PASSWORD: mengganti salah satunya mengeluarkan semua sesi. */
async function sessionKey(env: Env) {
  const raw = await sha256(`admin-session-v1\n${env.GITHUB_TOKEN}\n${env.ADMIN_PASSWORD}`);
  return crypto.subtle.importKey("raw", raw, { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export async function createSession(env: Env, nowMs = Date.now()) {
  const exp = Math.floor(nowMs / 1000) + SESSION_TTL_SECONDS;
  const nonce = toB64Url(crypto.getRandomValues(new Uint8Array(12)));
  const payload = `${exp}.${nonce}`;
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", await sessionKey(env), enc.encode(payload)));
  return `${payload}.${toB64Url(sig)}`;
}

export async function sessionValid(env: Env, cookieValue: string | null, nowMs = Date.now()) {
  if (!cookieValue || configProblem(env)) return false;
  const parts = cookieValue.split(".");
  if (parts.length !== 3) return false;
  const [expText, nonce, sig] = parts;
  const exp = Number(expText);
  if (!Number.isFinite(exp) || exp * 1000 <= nowMs || !nonce) return false;
  try { return await crypto.subtle.verify("HMAC", await sessionKey(env), fromB64Url(sig), enc.encode(`${expText}.${nonce}`)); }
  catch { return false; }
}

export function readCookie(request: Request, name: string) {
  for (const part of (request.headers.get("cookie") ?? "").split(";")) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return null;
}

export function sessionCookie(request: Request, value: string, maxAge: number) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${SESSION_COOKIE}=${value}; Max-Age=${maxAge}; Path=/; HttpOnly; SameSite=Strict${secure}`;
}
