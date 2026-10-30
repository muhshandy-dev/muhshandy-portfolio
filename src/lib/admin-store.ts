import { createHash, randomUUID } from "node:crypto";
import { copyFile, mkdir, readdir, readFile, rename, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { normalizeSite, parseSite, formatIssues, type SiteData } from "@/lib/site-schema";

export const SITE_FILE = path.join(process.cwd(), "src", "data", "site.json");
export const BACKUP_DIR = path.join(process.cwd(), ".portfolio-backups");
const AUTO_PREFIX = "site-auto-";
const KEEP = 30;

const revisionOf = (text: string) => createHash("sha256").update(text).digest("hex").slice(0, 16);

export async function readSite(): Promise<{ data: SiteData; revision: string }> {
  const text = await readFile(SITE_FILE, "utf8");
  return { data: normalizeSite(JSON.parse(text)), revision: revisionOf(text) };
}

export class ConflictError extends Error {}
export class ValidationError extends Error { constructor(public details: string[]) { super("Validasi gagal"); } }

/** Simpan atomik dengan deteksi konflik dan cadangan otomatis versi sebelumnya. */
export async function writeSite(input: unknown, baseRevision: string | undefined, force: boolean) {
  const parsed = parseSite(input);
  if (!parsed.success) throw new ValidationError(formatIssues(parsed.error, 8));
  const current = await readFile(SITE_FILE, "utf8").catch(() => "");
  if (current && !force && baseRevision !== revisionOf(current)) throw new ConflictError("site.json berubah sejak halaman admin dibuka");
  if (current) {
    await mkdir(BACKUP_DIR, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    await copyFile(SITE_FILE, path.join(BACKUP_DIR, `${AUTO_PREFIX}${stamp}.json`));
    await pruneBackups();
  }
  const text = JSON.stringify(parsed.data, null, 2) + "\n";
  const temp = `${SITE_FILE}.${randomUUID()}.tmp`;
  await writeFile(temp, text, "utf8");
  await rename(temp, SITE_FILE);
  return { data: parsed.data, revision: revisionOf(text) };
}

async function pruneBackups() {
  const files = (await readdir(BACKUP_DIR)).filter((f) => f.startsWith(AUTO_PREFIX) && f.endsWith(".json")).sort();
  for (const f of files.slice(0, Math.max(0, files.length - KEEP))) await unlink(path.join(BACKUP_DIR, f)).catch(() => {});
}

/** Cadangan otomatis dan cadangan dari skrip install lama (site.json.backup-*). */
export async function listBackups() {
  const names = await readdir(BACKUP_DIR).catch(() => [] as string[]);
  const valid = names.filter((n) => /^[\w.-]+$/.test(n) && (n.startsWith(AUTO_PREFIX) || n.startsWith("site.json.backup")));
  const rows = await Promise.all(valid.map(async (name) => { const s = await stat(path.join(BACKUP_DIR, name)); return { name, size: s.size, time: s.mtime.toISOString() }; }));
  return rows.sort((a, b) => b.time.localeCompare(a.time));
}

export async function readBackup(name: string) {
  const list = await listBackups();
  if (!list.some((b) => b.name === name)) throw new Error("Cadangan tidak ditemukan");
  return JSON.parse(await readFile(path.join(BACKUP_DIR, name), "utf8"));
}
