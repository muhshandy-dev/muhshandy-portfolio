import fs from "node:fs";
const data = JSON.parse(fs.readFileSync("src/data/site.json", "utf8"));
const ids = data.sections.map(s => s.id);
const required = ["hero", "about", "work", "education", "skills", "projects", "certifications", "activities", "blog", "contact"];
for (const key of required) if (!ids.includes(key)) throw new Error(`Section hilang: ${key}`);
if (new Set(ids).size !== required.length) throw new Error("Duplikat atau jumlah section salah");
for (const sec of data.sections) {
  if (!Number.isInteger(sec.columns) || sec.columns < 1 || sec.columns > 6) throw new Error(`Kolom tidak valid: ${sec.id}`);
  if (!["list", "cards", "compact"].includes(sec.layout)) throw new Error(`Layout tidak valid: ${sec.id}`);
}
if (!fs.existsSync("public/brand-default.svg")) throw new Error("Favicon default hilang");
if (!data.settings.contentWidth || !data.settings.languagePosition) throw new Error("Pengaturan tampilan hilang");
console.log("✅ Verifikasi V3: 10 section unik, layout/kolom valid, favicon tersedia, pengaturan tersedia.");
