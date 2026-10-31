// Gerbang untuk SEMUA endpoint /api/admin/*: konfigurasi lengkap, origin sama, dan sesi login sah (kecuali login).
import { configProblem, readCookie, SESSION_COOKIE, sessionValid } from "../../_lib/auth.ts";
import { json, originAllowed, type Handler } from "../../_lib/http.ts";

export const onRequest: Handler = async ({ request, env, next }) => {
  const problem = configProblem(env);
  if (problem) return json({ error: problem, code: "not_configured" }, 503);
  if (!originAllowed(request)) return json({ error: "Permintaan ditolak: origin tidak cocok." }, 403);
  const path = new URL(request.url).pathname.replace(/\/+$/, "");
  if (path === "/api/admin/login") return next();
  if (!(await sessionValid(env, readCookie(request, SESSION_COOKIE)))) return json({ error: "Belum login atau sesi habis.", code: "unauthorized" }, 401);
  return next();
};
