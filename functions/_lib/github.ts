import type { Env } from "./http.ts";

export class ConflictError extends Error {}
export class GithubError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}

const DEFAULT_REPO = "muhshandy-dev/muhshandy-portfolio";
const DEFAULT_BRANCH = "main";

const target = (env: Env) => ({ repo: env.GITHUB_REPO || DEFAULT_REPO, branch: env.GITHUB_BRANCH || DEFAULT_BRANCH, api: (env.GITHUB_API_URL || "https://api.github.com").replace(/\/$/, "") });

async function call(env: Env, path: string, init: { method?: string; body?: string } = {}) {
  const { repo, api } = target(env);
  return fetch(`${api}/repos/${repo}${path}`, {
    method: init.method ?? "GET",
    body: init.body,
    headers: {
      authorization: `Bearer ${env.GITHUB_TOKEN}`,
      accept: "application/vnd.github+json",
      "x-github-api-version": "2022-11-28",
      "user-agent": "portfolio-admin",
      ...(init.body ? { "content-type": "application/json" } : {}),
    },
  });
}

async function fail(res: Response, what: string): Promise<never> {
  let detail = "";
  try { detail = String(((await res.json()) as { message?: string }).message ?? ""); } catch { /* abaikan */ }
  if (res.status === 401) throw new GithubError(502, "GITHUB_TOKEN ditolak GitHub (salah atau kedaluwarsa). Buat token baru lalu perbarui variabelnya di Cloudflare.");
  if (res.status === 403 || res.status === 404) throw new GithubError(502, `GitHub menolak akses saat ${what}. Pastikan token punya izin Contents: Read and write pada repo ini.`);
  throw new GithubError(502, `GitHub error ${res.status} saat ${what}${detail ? `: ${detail}` : ""}`);
}

export function encodeText(text: string) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

function decodeText(base64: string) {
  const binary = atob(base64.replace(/\s/g, ""));
  return new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
}

export type RepoFile = { sha: string; text: string };

/** Baca file teks dari repo (cabang aktif, atau ref/commit tertentu). null bila tidak ada. */
export async function getFile(env: Env, path: string, ref?: string): Promise<RepoFile | null> {
  const res = await call(env, `/contents/${path}?ref=${encodeURIComponent(ref ?? target(env).branch)}`);
  if (res.status === 404) return null;
  if (!res.ok) await fail(res, `membaca ${path}`);
  const body = (await res.json()) as { sha: string; content?: string; encoding?: string };
  if (body.content && body.encoding === "base64") return { sha: body.sha, text: decodeText(body.content) };
  const blob = await call(env, `/git/blobs/${body.sha}`); // file > 1 MB tidak menyertakan isi
  if (!blob.ok) await fail(blob, `membaca ${path}`);
  return { sha: body.sha, text: decodeText(((await blob.json()) as { content: string }).content) };
}

/**
 * Tulis file lewat satu commit. `sha` = versi file yang diedit; GitHub menolak (409) bila file sudah berubah,
 * jadi dua sesi admin tidak saling menimpa. `contentBase64` boleh sangat besar: JSON dirakit manual agar CPU kecil.
 */
export async function putFile(env: Env, args: { path: string; contentBase64: string; message: string; sha?: string }) {
  const { branch } = target(env);
  const body = `{"message":${JSON.stringify(args.message)},"branch":${JSON.stringify(branch)}${args.sha ? `,"sha":${JSON.stringify(args.sha)}` : ""},"content":"${args.contentBase64}"}`;
  const res = await call(env, `/contents/${args.path}`, { method: "PUT", body });
  if (res.status === 409) throw new ConflictError("File berubah sejak dibuka");
  if (res.status === 422) {
    const message = String(((await res.json().catch(() => ({}))) as { message?: string }).message ?? "");
    if (/sha/i.test(message)) throw new ConflictError("File berubah sejak dibuka");
    throw new GithubError(502, `GitHub menolak data: ${message}`);
  }
  if (!res.ok) await fail(res, `menyimpan ${args.path}`);
  const out = (await res.json()) as { content: { sha: string }; commit: { sha: string } };
  return { sha: out.content.sha, commit: out.commit.sha };
}

export async function listCommits(env: Env, path: string, limit = 30) {
  const res = await call(env, `/commits?path=${encodeURIComponent(path)}&sha=${encodeURIComponent(target(env).branch)}&per_page=${limit}`);
  if (!res.ok) await fail(res, "membaca riwayat");
  const rows = (await res.json()) as { sha: string; commit: { message: string; author?: { date?: string }; committer?: { date?: string } } }[];
  return rows.map((r) => ({ sha: r.sha, message: r.commit.message.split("\n")[0], time: r.commit.committer?.date ?? r.commit.author?.date ?? "" }));
}
