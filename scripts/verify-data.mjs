// Periksa src/data/site.json dengan skema yang sama dipakai website dan admin.
import { readFileSync } from "node:fs";
import { parseSite, COLLECTION_KEYS } from "../src/lib/site-schema.ts";

const file = process.argv[2] ?? "src/data/site.json";
const result = parseSite(JSON.parse(readFileSync(file, "utf8")));
if (!result.success) {
  console.error(`❌ ${file} tidak valid:`);
  for (const i of result.error.issues.slice(0, 20)) console.error(`  - ${i.path.join(".")}: ${i.message}`);
  process.exit(1);
}
const d = result.data;
const counts = COLLECTION_KEYS.map((k) => `${k}=${d[k].length}`).join(", ");
const demo = COLLECTION_KEYS.reduce((n, k) => n + d[k].filter((i) => i.demo).length, 0);
console.log(`✅ ${file} valid. ${d.sections.length} section. ${counts}.`);
console.log(demo ? `⚠️  ${demo} item berlabel DEMO — ganti atau hapus sebelum dikirim ke rekruter.` : "Tidak ada item DEMO.");
