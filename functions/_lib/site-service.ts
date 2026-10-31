import { encodeText, getFile, putFile } from "./github.ts";
import type { Env } from "./http.ts";

export const SITE_PATH = "src/data/site.json";

export class ValidationError extends Error {
  details: string[];
  constructor(details: string[]) { super("Validasi gagal"); this.details = details; }
}

/*
 * Server sengaja TIDAK memuat skema zod. Paket gratis Cloudflare membatasi CPU 10 ms per permintaan, dan
 * validasi skema penuh pada permintaan pertama (isolate dingin) terukur 8–15 ms. Pembagian tugasnya:
 *  - Peramban admin memvalidasi dengan skema yang sama persis sebelum mengirim, dan tombol Simpan mati bila ada masalah.
 *  - Server memeriksa bentuk dasar saja (cukup untuk menolak kiriman rusak atau bukan dari admin).
 *  - Pengaman terakhir: build Cloudflare dan CI memvalidasi penuh (normalizeSite / pnpm verify). Bila gagal, deploy gagal
 *    dan situs lama tetap tayang, dan versi sebelumnya bisa dipulihkan dari Riwayat.
 */
const COLLECTIONS = ["projects", "work", "education", "certifications", "skills", "activities", "posts", "socialLinks"] as const;
const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);

export function checkShape(input: unknown): string[] {
  if (!isObject(input)) return ["data wajib berupa objek"];
  const problems: string[] = [];
  if (!isObject(input.profile)) problems.push("profile wajib berupa objek");
  if (!isObject(input.settings)) problems.push("settings wajib berupa objek");
  if (!Array.isArray(input.sections)) problems.push("sections wajib berupa daftar");
  for (const key of COLLECTIONS) {
    const list = input[key];
    if (!Array.isArray(list)) problems.push(`${key} wajib berupa daftar`);
    else if (list.some((item) => !isObject(item) || typeof item.id !== "string" || !item.id)) problems.push(`${key}: setiap item wajib punya id`);
  }
  return problems.slice(0, 8);
}

/** Isi mentah dari GitHub. Pelengkapan default (normalizeSite) dikerjakan peramban agar CPU server kecil. */
export async function readSite(env: Env): Promise<{ data: unknown; revision: string }> {
  const file = await getFile(env, SITE_PATH);
  if (!file) throw new Error(`${SITE_PATH} tidak ditemukan di repo`);
  let data: unknown;
  try { data = JSON.parse(file.text); } catch { throw new ValidationError([`${SITE_PATH} di repo bukan JSON yang valid. Pulihkan dari riwayat commit di GitHub.`]); }
  return { data, revision: file.sha };
}

/** Periksa bentuk, lalu commit ke repo. Cloudflare membangun ulang situs otomatis dari commit itu. */
export async function writeSite(env: Env, input: unknown, baseRevision: string | undefined, force: boolean) {
  const problems = checkShape(input);
  if (problems.length) throw new ValidationError(problems);
  let sha = baseRevision;
  if (!sha) {
    if (!force) throw new ValidationError(["baseRevision wajib diisi"]);
    sha = (await getFile(env, SITE_PATH))?.sha;
  } else if (force) {
    sha = (await getFile(env, SITE_PATH))?.sha;
  }
  const text = JSON.stringify(input, null, 2) + "\n";
  const out = await putFile(env, { path: SITE_PATH, contentBase64: encodeText(text), message: "Admin: perbarui isi situs", sha });
  return { data: input, revision: out.sha, commit: out.commit };
}
