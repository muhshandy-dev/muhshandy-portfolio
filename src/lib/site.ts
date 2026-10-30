import data from "@/data/site.json";
import { normalizeSite, type SiteData } from "@/lib/site-schema";

// src/data/site.json adalah satu sumber kebenaran. Data lama dilengkapi dengan default
// saat build (lihat normalizeSite), jadi file V2–V4 tetap terbaca tanpa migrasi manual.
// Jika file rusak, build sengaja gagal dengan pesan yang jelas daripada menampilkan halaman kosong.
// Hanya dipakai di server component (layout, metadata, generateStaticParams).
export const site: SiteData = normalizeSite(data);
export * from "@/lib/site-utils";
