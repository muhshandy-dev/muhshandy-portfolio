// Non-destructive migration from Admin V2 to V3; running twice is safe.
import fs from "node:fs";
import path from "node:path";
const file = path.join(process.cwd(), "src/data/site.json");
if (!fs.existsSync(file)) { console.error("src/data/site.json tidak ditemukan."); process.exit(1); }
const data = JSON.parse(fs.readFileSync(file, "utf8"));
if (!Array.isArray(data.sections) || !data.settings || !data.profile) { console.error("Data tidak dikenali. Tidak ada perubahan yang disimpan."); process.exit(1); }
const now = new Date().toISOString().replace(/[:.]/g, "-");
const backup = `${file}.backup-before-v3-${now}`;
fs.copyFileSync(file, backup);
const defaults = {
  hero: { title: "Profil utama", visible: true, columns: 1, layout: "list", subtitle: "" },
  about: { columns: 1, layout: "list" },
  work: { columns: 2, layout: "cards" },
  education: { columns: 2, layout: "cards" },
  skills: { columns: 4, layout: "list" },
  projects: { columns: 4, layout: "cards" },
  certifications: { columns: 6, layout: "compact" },
  activities: { columns: 3, layout: "cards" },
  blog: { columns: 3, layout: "cards" },
  contact: { columns: 1, layout: "cards" },
};
if (!data.sections.some(s => s.id === "hero")) data.sections.unshift({ id: "hero", ...defaults.hero });
for (const sec of data.sections) {
  const base = defaults[sec.id] ?? { columns: 1, layout: "list" };
  if (sec.columns === undefined) sec.columns = base.columns;
  if (sec.layout === undefined) sec.layout = base.layout;
}
if (data.settings.faviconUrl === undefined) data.settings.faviconUrl = "";
if (data.settings.contentWidth === undefined) data.settings.contentWidth = "wide";
if (data.settings.languagePosition === undefined) data.settings.languagePosition = "top-right";
// Atomic replacement, so interrupted writes cannot leave partially written JSON.
const tmp = file + ".v3.tmp";
fs.writeFileSync(tmp, JSON.stringify(data, null, 2) + "\n");
fs.renameSync(tmp, file);
console.log("✅ Migrasi V3 selesai. Semua data dari V2 tetap tersimpan.");
console.log("Backup:", path.basename(backup));
console.log("Proyek: 4 kolom desktop · Sertifikasi: 6 kolom desktop.");
