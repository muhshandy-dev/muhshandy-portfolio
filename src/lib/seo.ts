import { site } from "@/lib/site";

/** URL publik situs (untuk canonical, sitemap, Open Graph). Diisi di admin → SEO. */
export function siteUrl() {
  const u = site.profile.siteUrl;
  return /^https?:\/\//.test(u) ? u.replace(/\/$/, "") : "http://localhost:3000";
}
