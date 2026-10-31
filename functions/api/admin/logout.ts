import { sessionCookie } from "../../_lib/auth.ts";
import { json, type Handler } from "../../_lib/http.ts";

export const onRequestPost: Handler = ({ request }) => json({ ok: true }, 200, { "set-cookie": sessionCookie(request, "", 0) });
