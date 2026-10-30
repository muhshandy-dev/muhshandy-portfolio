import type { CollectionKey, SiteData } from "@/lib/site-schema";

// Helper murni tanpa zod/site.json, aman dipakai komponen klien tanpa membesarkan bundle.

/** Item yang ditampilkan ke publik (yang disembunyikan di admin tidak ikut). */
export function shown<K extends CollectionKey>(data: SiteData, key: K): SiteData[K] {
  return data[key].filter((item) => !item.hidden) as SiteData[K];
}
export function publishedPosts(data: SiteData) {
  return shown(data, "posts").filter((p) => p.status === "published");
}
export function hasDemoContent(data: SiteData) {
  return (["skills", "work", "education", "projects", "certifications", "activities", "posts"] as const).some((k) => shown(data, k).some((i) => i.demo));
}
/** Section yang punya konten untuk ditampilkan (dipakai navigasi dan halaman). */
export function sectionHasContent(data: SiteData, id: SiteData["sections"][number]["id"]) {
  switch (id) {
    case "hero": case "about": case "contact": return true;
    case "blog": return publishedPosts(data).length > 0;
    case "projects": return true; // tetap tampil dengan pesan kosong
    default: return shown(data, id).length > 0;
  }
}
