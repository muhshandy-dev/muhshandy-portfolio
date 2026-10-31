import { createSession, passwordMatches, SESSION_TTL_SECONDS, sessionCookie } from "../../_lib/auth.ts";
import { json, sleep, type Handler } from "../../_lib/http.ts";

export const onRequestPost: Handler = async ({ request, env }) => {
  const text = await request.text();
  if (text.length > 2048) return json({ error: "Permintaan terlalu besar" }, 413);
  let password = "";
  try { password = String((JSON.parse(text) as { password?: unknown }).password ?? ""); } catch { return json({ error: "JSON tidak valid" }, 400); }
  if (!(await passwordMatches(env, password))) {
    await sleep(1200); // memperlambat tebak-tebakan; batas jumlah percobaan: lihat docs/ADMIN_ONLINE.md
    return json({ error: "Kata sandi salah" }, 401);
  }
  return json({ ok: true }, 200, { "set-cookie": sessionCookie(request, await createSession(env), SESSION_TTL_SECONDS) });
};
