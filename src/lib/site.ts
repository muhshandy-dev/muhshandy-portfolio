import data from "@/data/site.json";
import type { SiteData } from "@/lib/site-schema";

// Konten lokal adalah satu sumber kebenaran, diterbitkan ulang saat deploy.
export const site = data as SiteData;
export const section = (id: SiteData["sections"][number]["id"]) => site.sections.find((s) => s.id === id)!;
// Semua proyek tampil tanpa filter status. Deskripsi tetap menyebut "rencana" bila belum dibuat.
export const publicProjects = () => site.projects;
