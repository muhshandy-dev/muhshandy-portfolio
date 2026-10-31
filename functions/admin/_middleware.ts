// Melindungi halaman /admin: tanpa sesi login yang sah, pengunjung diarahkan ke /admin/login/.
import { readCookie, SESSION_COOKIE, sessionValid } from "../_lib/auth.ts";
import { hardened, redirect, type Handler } from "../_lib/http.ts";

export const onRequest: Handler = async ({ request, env, next }) => {
  const path = new URL(request.url).pathname.replace(/\/+$/, "");
  const loggedIn = await sessionValid(env, readCookie(request, SESSION_COOKIE));
  if (path === "/admin/login") return loggedIn ? redirect("/admin/") : hardened(await next());
  if (!loggedIn) return redirect("/admin/login/");
  return hardened(await next());
};
