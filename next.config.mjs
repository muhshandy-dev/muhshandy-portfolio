/**
 * Dua mode build:
 * - `pnpm dev` / `pnpm build`: termasuk admin lokal (file *.admin.ts[x], menulis ke disk). Admin tetap 404 di production.
 * - `pnpm build:static` (STATIC_EXPORT=1): ekspor HTML statis ke folder out/ untuk Cloudflare Pages.
 *   File *.admin.ts[x] (admin lokal + API berbasis disk) tidak ikut. Yang ikut hanya halaman admin online (*.online.tsx),
 *   yang bicara dengan Cloudflare Pages Functions di folder functions/ (login + commit ke GitHub).
 */
const isStatic = process.env.STATIC_EXPORT === "1";
const base = ["tsx", "ts", "jsx", "js"];

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  pageExtensions: isStatic ? ["online.tsx", ...base] : ["admin.tsx", "admin.ts", ...base],
  ...(isStatic
    ? { output: "export", trailingSlash: true, images: { unoptimized: true } }
    : { async headers() { return [{ source: "/:path*", headers: securityHeaders }]; } }),
};

export default nextConfig;
