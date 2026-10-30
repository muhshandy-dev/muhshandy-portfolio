import { site } from "@/lib/site";

/**
 * URL publik situs (untuk canonical, sitemap, Open Graph).
 * Urutan: variabel lingkungan SITE_URL (diisi di Cloudflare Pages) → admin → SEO → localhost.
 */
export function siteUrl() {
  const fromEnv = process.env.SITE_URL ?? "";
  if (/^https?:\/\//.test(fromEnv)) return fromEnv.replace(/\/$/, "");
  const u = site.profile.siteUrl;
  return /^https?:\/\//.test(u) ? u.replace(/\/$/, "") : "http://localhost:3000";
}
