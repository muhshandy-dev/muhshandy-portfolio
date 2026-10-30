// Build situs statis (folder out/) untuk Cloudflare Pages / hosting statis lain. Lintas platform.
import { spawnSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";

const result = spawnSync("pnpm", ["exec", "next", "build"], { stdio: "inherit", env: { ...process.env, STATIC_EXPORT: "1" }, shell: process.platform === "win32" });
if (result.status !== 0) process.exit(result.status ?? 1);
if (!existsSync("out/index.html")) { console.error("❌ out/index.html tidak ditemukan"); process.exit(1); }
// Header keamanan untuk Cloudflare Pages (file _headers dibaca otomatis).
writeFileSync("out/_headers", `/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: SAMEORIGIN
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
`);
if (existsSync("out/admin") || existsSync("out/admin.html")) { console.error("❌ Halaman admin ikut ter-ekspor, dibatalkan"); process.exit(1); }
console.log("\n✅ Situs statis siap di folder out/ (tanpa admin). Upload ke Cloudflare Pages: build command `pnpm build:static`, output `out`.");
