import { getFile, GithubError, listCommits } from "../../_lib/github.ts";
import { json, type Handler } from "../../_lib/http.ts";
import { SITE_PATH } from "../../_lib/site-service.ts";

/** Riwayat versi = commit Git yang mengubah site.json. */
export const onRequestGet: Handler = async ({ request, env }) => {
  const name = new URL(request.url).searchParams.get("name");
  try {
    if (name) {
      if (!/^[0-9a-f]{40}$/.test(name)) return json({ error: "Versi tidak valid" }, 400);
      const file = await getFile(env, SITE_PATH, name);
      if (!file) return json({ error: "Versi tidak ditemukan" }, 404);
      return json({ data: JSON.parse(file.text) });
    }
    const commits = await listCommits(env, SITE_PATH);
    return json({ backups: commits.map((c) => ({ name: c.sha, label: c.message, time: c.time })) });
  } catch (e) {
    if (e instanceof GithubError) return json({ error: e.message }, e.status);
    return json({ error: "Gagal membaca riwayat" }, 500);
  }
};
