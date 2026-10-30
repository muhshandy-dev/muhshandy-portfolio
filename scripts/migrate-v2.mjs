// Upgrade Admin V1 -> V2. Keep the user's current site.json and make a backup first.
import fs from "node:fs";
import path from "node:path";

const dataPath = path.join(process.cwd(), "src/data/site.json");
if (!fs.existsSync(dataPath)) {
  console.error("site.json tidak ditemukan. Jalankan dari folder portfolio-saya.");
  process.exit(1);
}
const json = JSON.parse(fs.readFileSync(dataPath, "utf8"));
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backup = `${dataPath}.backup-before-v2-${stamp}`;
fs.copyFileSync(dataPath, backup);

const en = (obj, key, idText, english) => {
  if (obj?.[key] === idText && !obj.en?.[key]) obj.en = { ...obj.en, [key]: english };
};
const defaults = [
  ["da10", "Rencana: observatori kualitas data NYC TLC, kontrak skema, pemeriksaan data, dan dashboard statis yang dapat diaudit.", "Project proposal: an NYC TLC data-quality observatory, schema contracts, validation checks, and an auditable static dashboard."],
  ["ai04", "Rencana: deteksi anomali sensor dengan fokus pada false alarm dan detection delay.", "Project proposal: sensor anomaly detection with a focus on false alarms and detection delay."],
  ["ai01", "Rencana: copilot dokumen K3 berbahasa Indonesia dengan sitasi dan kemampuan menolak klaim tanpa bukti.", "Project proposal: an Indonesian-language occupational safety document copilot with citations and evidence-based abstention."],
  ["ai03", "Rencana: inspeksi cacat visual dengan pengujian threshold dan pelaporan false reject rate.", "Project proposal: visual defect inspection with threshold evaluation and false-reject reporting."],
  ["ai06", "Rencana: pemodelan risiko fraud pembukaan rekening, kalibrasi, dan evaluasi fairness.", "Project proposal: account-opening fraud risk modeling, calibration, and fairness evaluation."],
  ["da07", "Rencana: ramalan kebutuhan energi day-ahead dengan baseline, interval, dan biaya keputusan.", "Project proposal: day-ahead energy-demand forecasting with baselines, prediction intervals, and decision costs."],
  ["ai05", "Rencana: analisis sentimen dan emosi bahasa Indonesia dengan evaluasi lintas domain.", "Project proposal: Indonesian sentiment and emotion analysis with cross-domain evaluation."],
  ["ai02", "Rencana: ekstraksi terstruktur dari struk dan invoice Indonesia dengan antrean peninjauan.", "Project proposal: structured information extraction from Indonesian receipts and invoices with human review."],
  ["da08", "Rencana: cohort retention dan eksperimen acak untuk analisis kausal yang tepat.", "Project proposal: cohort retention and randomized experiments for credible causal analysis."],
  ["da09", "Rencana: atlas spasial yang memperlihatkan perbedaan random CV dan spatial CV.", "Project proposal: a spatial atlas highlighting differences between random and spatial cross-validation."],
];
for (const project of json.projects ?? []) {
  const match = defaults.find(([id]) => id === project.id);
  if (match) en(project, "description", match[1], match[2]);
  if (project.dates === "Roadmap 2026–2027") en(project, "dates", "Roadmap 2026–2027", "Roadmap 2026–2027");
  delete project.status;
  delete project.mode;
}
if (json.settings) {
  delete json.settings.showPlannedProjects;
  en(json.settings, "introGreeting", "Halo, saya", "Hi, I'm");
  en(json.settings, "contactHeading", "Mari terhubung", "Let's connect");
  en(json.settings, "contactText", "Tertarik berdiskusi atau berkolaborasi? Hubungi aku lewat email atau media sosial di bawah.", "Interested in discussing ideas or collaborating? Reach me by email or through social media below.");
}
if (json.profile) {
  en(json.profile, "headline", "Aspiring Applied AI / ML Engineer · Data Analytics", "Aspiring Applied AI / ML Engineer · Data Analytics");
  en(json.profile, "description", "Membangun solusi AI dan data yang bisa diuji, dijelaskan, dan digunakan.", "Building testable, explainable, and practical AI and data solutions.");
  const previousSummary = "Selamat datang di portofolioku. Di sini aku mendokumentasikan pengalaman, kompetensi, serta proyek AI/Data dari perencanaan hingga hasil yang bisa direproduksi. Semua status proyek ditampilkan secara transparan.";
  en(json.profile, "summary", previousSummary, "Welcome to my portfolio. Here I document my experience, skills, and AI/data work—from early concepts to reproducible results. Project descriptions distinguish future plans from completed work.");
  if (json.profile.summary === previousSummary) json.profile.summary = "Selamat datang di portofolioku. Di sini aku mendokumentasikan pengalaman, kompetensi, serta rencana dan hasil proyek AI/Data. Deskripsi masing-masing proyek menjelaskan apa yang sudah dikerjakan.";
}
const headings = {
  about: ["Tentang Saya", "About me", "", ""],
  work: ["Pengalaman & Magang", "Experience & internships", "Pengalaman profesional dan organisasi", "Professional and organizational experience"],
  education: ["Pendidikan", "Education", "", ""],
  skills: ["Keahlian", "Skills", "", ""],
  projects: ["Proyek", "Projects", "Proyek yang sudah dikerjakan dan terbukti, bukan hanya ide.", "Projects, studies, and proposals; each description identifies what has been built."],
  certifications: ["Sertifikasi", "Certifications", "Sertifikat dan bukti pembelajaran", "Certificates and learning credentials"],
  activities: ["Kegiatan", "Activities", "Hackathon, komunitas, dan kegiatan lain", "Hackathons, community work, and other activities"],
  blog: ["Tulisan", "Writing", "Catatan dan pembelajaran", "Notes and lessons"],
  contact: ["Kontak", "Contact", "", ""],
};
for (const sec of json.sections ?? []) {
  const h = headings[sec.id];
  if (h) { en(sec, "title", h[0], h[1]); if (h[2]) en(sec, "subtitle", h[2], h[3]); }
  if (sec.id === "projects" && sec.subtitle === "Proyek yang sudah dikerjakan dan terbukti, bukan hanya ide.") {
    sec.subtitle = "Karya, studi kasus, serta ide proyek yang sedang dipersiapkan.";
  }
}
fs.writeFileSync(dataPath, JSON.stringify(json, null, 2) + "\n");
console.log("Upgrade berhasil. Data lama tetap dipertahankan.");
console.log("Backup: " + path.basename(backup));
console.log("Semua proyek kini terlihat di halaman publik tanpa menu status.");
