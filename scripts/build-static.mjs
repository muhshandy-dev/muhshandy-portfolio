// Build situs statis (folder out/) untuk Cloudflare Pages / hosting statis lain. Lintas platform.
import { spawnSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";

// Di Cloudflare Pages, URL produksi diturunkan otomatis dari CF_PAGES_URL (https://<hash>.<proyek>.pages.dev → https://<proyek>.pages.dev)
// bila SITE_URL tidak diisi. Bisa ditimpa dengan variabel SITE_URL (mis. domain sendiri).
const env = { ...process.env, STATIC_EXPORT: "1" };
if (!env.SITE_URL && env.CF_PAGES_URL) {
  try {
    const host = new URL(env.CF_PAGES_URL).hostname.split(".");
    if (host.length === 4 && host.slice(-2).join(".") === "pages.dev") env.SITE_URL = `https://${host.slice(1).join(".")}`;
  } catch { /* biarkan memakai URL dari admin */ }
}
if (env.SITE_URL) console.log(`URL situs: ${env.SITE_URL}`);
const result = spawnSync("pnpm", ["exec", "next", "build"], { stdio: "inherit", env, shell: process.platform === "win32" });
if (result.status !== 0) process.exit(result.status ?? 1);
if (!existsSync("out/index.html")) { console.error("❌ out/index.html tidak ditemukan"); process.exit(1); }
// Header keamanan untuk Cloudflare Pages (file _headers dibaca otomatis).
writeFileSync("out/_headers", `/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: SAMEORIGIN
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()

/opengraph-image
  Content-Type: image/png
`);
if (existsSync("out/admin") || existsSync("out/admin.html")) { console.error("❌ Halaman admin ikut ter-ekspor, dibatalkan"); process.exit(1); }
console.log("\n✅ Situs statis siap di folder out/ (tanpa admin). Upload ke Cloudflare Pages: build command `pnpm build:static`, output `out`.");
