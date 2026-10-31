import { ConflictError, GithubError } from "../../_lib/github.ts";
import { json, type Handler } from "../../_lib/http.ts";
import { readSite, ValidationError, writeSite } from "../../_lib/site-service.ts";

const MAX_BYTES = 2 * 1024 * 1024;

function failure(e: unknown) {
  if (e instanceof ConflictError) return json({ error: "site.json berubah di GitHub sejak halaman admin dibuka" }, 409);
  if (e instanceof ValidationError) return json({ error: "Validasi gagal", details: e.details }, 400);
  if (e instanceof GithubError) return json({ error: e.message }, e.status);
  console.error("[admin] kesalahan tak terduga", e);
  return json({ error: "Kesalahan tak terduga di server admin" }, 500);
}

export const onRequestGet: Handler = async ({ env }) => {
  try { return json(await readSite(env)); } catch (e) { return failure(e); }
};

export const onRequestPost: Handler = async ({ request, env }) => {
  const text = await request.text();
  if (text.length > MAX_BYTES) return json({ error: "Data terlalu besar (maks. 2 MB)" }, 413);
  let body: { data?: unknown; baseRevision?: string; force?: boolean };
  try { body = JSON.parse(text); } catch { return json({ error: "JSON tidak valid" }, 400); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: "Format permintaan tidak valid" }, 400);
  try {
    const result = await writeSite(env, body.data, typeof body.baseRevision === "string" ? body.baseRevision : undefined, body.force === true);
    return json({ ok: true, data: result.data, revision: result.revision });
  } catch (e) { return failure(e); }
};
