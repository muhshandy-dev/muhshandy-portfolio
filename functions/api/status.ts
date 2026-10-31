import { configProblem } from "../_lib/auth.ts";
import { json, type Handler } from "../_lib/http.ts";

/** Cek publik tanpa rahasia: membuktikan Pages Functions aktif dan apakah dua rahasia admin sudah terisi (hanya ya/tidak). */
export const onRequestGet: Handler = ({ env }) =>
  json({ functions: true, adminSiap: configProblem(env) === null }, 200, { "cache-control": "no-store" });
