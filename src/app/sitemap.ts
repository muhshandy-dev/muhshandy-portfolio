import type { MetadataRoute } from "next";
import { publishedPosts, shown, site } from "@/lib/site";
import { siteUrl } from "@/lib/seo";

export const dynamic = "force-static";
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const blogVisible = site.sections.find((s) => s.id === "blog")?.visible;
  return [
    { url: `${base}/`, changeFrequency: "monthly", priority: 1 },
    ...shown(site, "projects").map((p) => ({ url: `${base}/projects/${p.id}`, changeFrequency: "monthly" as const, priority: 0.7 })),
    ...(blogVisible ? [{ url: `${base}/blog`, changeFrequency: "weekly" as const, priority: 0.5 }, ...publishedPosts(site).map((p) => ({ url: `${base}/blog/${p.slug}`, lastModified: /^\d{4}-\d{2}-\d{2}$/.test(p.date) ? p.date : undefined, priority: 0.5 }))] : []),
  ];
}
