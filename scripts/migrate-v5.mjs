/**
 * Migrasi V5 (opsional): menulis field baru dengan nilai default ke site.json supaya terlihat jelas
 * di file. Website dan admin sudah bisa membaca file lama tanpa migrasi ini.
 * - Membuat cadangan dulu di .portfolio-backups/
 * - Tidak menghapus field atau item apa pun (field tak dikenal tetap disimpan)
 * - Idempoten: aman dijalankan berulang kali
 */
import { copyFileSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseSite } from "../src/lib/site-schema.ts";

const file = path.resolve("src/data/site.json");
const raw = JSON.parse(readFileSync(file, "utf8"));
// Status lama ditulis dengan huruf besar/variasi (mis. "Planned")
for (const p of raw.projects ?? []) {
  if (typeof p.status === "string") {
    const s = p.status.toLowerCase().replace(/[\s_]+/g, "-");
    p.status = ["planned", "in-progress", "completed"].includes(s) ? s : s === "done" ? "completed" : "planned";
  }
}
const result = parseSite(raw);
if (!result.success) {
  console.error("❌ Data tidak bisa dimigrasi otomatis:");
  for (const i of result.error.issues.slice(0, 10)) console.error(`  - ${i.path.join(".")}: ${i.message}`);
  process.exit(1);
}
const dir = path.resolve(".portfolio-backups");
mkdirSync(dir, { recursive: true });
const backup = path.join(dir, `site.json.backup-before-v5-${new Date().toISOString().replace(/[:.]/g, "-")}`);
copyFileSync(file, backup);
const tmp = `${file}.v5-tmp`;
writeFileSync(tmp, JSON.stringify(result.data, null, 2) + "\n");
renameSync(tmp, file);
console.log("✅ Migrasi V5 selesai. Data lama dipertahankan.");
console.log("Cadangan:", backup);
