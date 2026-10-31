/** Tipe minimal Cloudflare Pages Functions (tanpa menambah dependency). */
export type Env = {
  ADMIN_PASSWORD?: string;
  GITHUB_TOKEN?: string;
  /** "pemilik/repo". Bawaan: muhshandy-dev/muhshandy-portfolio */
  GITHUB_REPO?: string;
  /** Bawaan: main */
  GITHUB_BRANCH?: string;
  /** Hanya untuk pengujian lokal dengan GitHub palsu. Bawaan: https://api.github.com */
  GITHUB_API_URL?: string;
  /** Batas unggahan dalam MB. Bawaan 2 (aman untuk batas CPU paket gratis Cloudflare). */
  UPLOAD_MAX_MB?: string;
};

export type Ctx = { request: Request; env: Env; next: () => Promise<Response> };
export type Handler = (ctx: Ctx) => Response | Promise<Response>;

const BASE_HEADERS = {
  "cache-control": "no-store",
  "x-robots-tag": "noindex, nofollow",
  "x-content-type-options": "nosniff",
  "referrer-policy": "no-referrer",
} as const;

export function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", ...BASE_HEADERS, ...headers } });
}

export function redirect(to: string) {
  return new Response(null, { status: 302, headers: { location: to, ...BASE_HEADERS } });
}

/** Tambahkan header keamanan ke respons halaman statis admin. */
export function hardened(res: Response) {
  const out = new Response(res.body, res);
  for (const [k, v] of Object.entries(BASE_HEADERS)) out.headers.set(k, v);
  out.headers.set("x-frame-options", "DENY");
  return out;
}

/**
 * Perlindungan CSRF tambahan di atas cookie SameSite=Strict:
 * permintaan yang mengubah data wajib membawa Origin yang sama dengan situs, dan Sec-Fetch-Site (bila ada) bukan lintas situs.
 */
export function originAllowed(request: Request) {
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") return false;
  if (request.method === "GET" || request.method === "HEAD") return true;
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try { return new URL(origin).origin === new URL(request.url).origin; } catch { return false; }
}

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
