/**
 * V4 migration: keep real content, add labelled sample entries only to empty collections,
 * install accessible carousel defaults and backup user's data before modifying anything.
 * Idempotent: every sample has a deterministic ID and entries are only seeded if empty.
 */
import fs from "node:fs";
import path from "node:path";
const file = path.resolve("src/data/site.json");
if (!fs.existsSync(file)) { console.error("❌ src/data/site.json tidak ada"); process.exit(1); }
const data = JSON.parse(fs.readFileSync(file, "utf8"));
if (!data.profile || !data.settings || !Array.isArray(data.sections)) { throw new Error("Struktur site.json tidak dikenal, instalasi dibatalkan."); }
const backupDir = path.resolve(".portfolio-backups");
fs.mkdirSync(backupDir, { recursive: true });
const backup = path.join(backupDir, `site.json.backup-before-v4-${new Date().toISOString().replace(/[:.]/g, "-")}`);
fs.copyFileSync(file, backup);
const sample = (id, rest, en = {}) => ({ id: `sample-${id}`, demo: true, ...rest, en });
const sampleCerts = [
  ["Pengantar Python", "Python Basics"], ["Analisis Data", "Data Analytics"], ["Fundamental SQL", "SQL Fundamentals"],
  ["Machine Learning Dasar", "Machine Learning Fundamentals"], ["Visualisasi Data", "Data Visualization"], ["Git & GitHub", "Git & GitHub"],
  ["Dasar Cloud Computing", "Cloud Computing Fundamentals"], ["Statistik Terapan", "Applied Statistics"], ["Data Storytelling", "Data Storytelling"],
  ["Web Development", "Web Development"], ["Dasar MLOps", "MLOps Fundamentals"], ["Etika dan AI", "AI & Ethics"],
].map(([title, english], i) => sample(`cert-${i+1}`, { title, issuer: "Penyelenggara Contoh", issued: `2026-${String((i%12)+1).padStart(2,"0")}`, credentialId:"", credentialUrl:"", imageUrl:"/demo-cover/cert.svg", documentUrl:"" }, {title: english, issuer: "Sample Provider"}));
const emptyOnly = (key, values) => { if (!Array.isArray(data[key]) || data[key].length === 0) data[key] = values; };
emptyOnly("work", [
  sample("work-1", {company:"Perusahaan Contoh A", title:"Data Analyst Intern", type:"Internship",location:"Remote",start:"2026",end:"2026",description:"Contoh: membantu validasi kualitas data, menyusun dashboard sederhana, dan mendokumentasikan temuan.",href:"",logoUrl:"/demo-cover/org.svg"},{company:"Sample Company A",description:"Sample: validated data quality, built a basic dashboard, and documented findings."}),
  sample("work-2", {company:"Studio Contoh B",title:"Frontend Developer",type:"Freelance",location:"Remote",start:"2025",end:"2025",description:"Contoh: membuat antarmuka responsif dan komponen yang dapat digunakan ulang.",href:"",logoUrl:"/demo-cover/org.svg"},{company:"Sample Studio B",description:"Sample: built responsive interfaces and reusable components."}),
  sample("work-3", {company:"Komunitas Teknologi Contoh",title:"Anggota Divisi Teknologi",type:"Organization",location:"Indonesia",start:"2025",end:"2026",description:"Contoh: menyelenggarakan diskusi teknologi dan berbagi materi belajar.",href:"",logoUrl:"/demo-cover/org.svg"},{company:"Sample Tech Community",title:"Technology Team Member",description:"Sample: coordinated discussions and shared learning materials."}),
  sample("work-4", {company:"Laboratorium Contoh",title:"Asisten Riset Data",type:"Other",location:"Indonesia",start:"2024",end:"2025",description:"Contoh: melakukan eksperimen data dan menyiapkan dokumentasi teknis.",href:"",logoUrl:"/demo-cover/org.svg"},{company:"Sample Laboratory",title:"Data Research Assistant",description:"Sample: ran data experiments and prepared technical documentation."}),
]);
emptyOnly("education", [
  sample("edu-1", {school:"Universitas Contoh",degree:"Sarjana — Informatika / Data",start:"2022",end:"2026",href:"",logoUrl:"/demo-cover/school.svg"},{school:"Sample University",degree:"Bachelor's — Computing / Data"}),
  sample("edu-2", {school:"Sekolah Menengah Contoh",degree:"Jurusan Sains",start:"2019",end:"2022",href:"",logoUrl:"/demo-cover/school.svg"},{school:"Sample High School",degree:"Science Program"}),
]);
emptyOnly("skills", ["Python","TypeScript","JavaScript","SQL","React","Next.js","Node.js","Git","GitHub","Pandas","NumPy","Scikit-learn","TensorFlow","PyTorch","DuckDB","Power BI","Matplotlib","Docker","REST API","PostgreSQL","Data Cleaning","Machine Learning","Statistics","MLOps"].map((name,i) => sample(`skill-${i+1}`,{name})));
emptyOnly("certifications", sampleCerts);
emptyOnly("activities", [
  sample("activity-1",{title:"Kompetisi Data Science (Contoh)",dates:"2026",location:"Online",description:"Data dummy untuk menguji kartu kegiatan. Ganti dengan acara sebenarnya.",image:"",href:""},{title:"Data Science Competition (Sample)",description:"Sample entry for previewing the activity layout."}),
  sample("activity-2",{title:"Workshop Machine Learning (Contoh)",dates:"2026",location:"Online",description:"Data dummy untuk meninjau layout aktivitas.",image:"",href:""},{title:"Machine Learning Workshop (Sample)"}),
  sample("activity-3",{title:"Hackathon UI/UX (Contoh)",dates:"2025",location:"Indonesia",description:"Data dummy, bukan partisipasi asli.",image:"",href:""},{title:"UI/UX Hackathon (Sample)"}),
  sample("activity-4",{title:"Seminar Teknologi (Contoh)",dates:"2025",location:"Online",description:"Data dummy untuk melihat carousel kegiatan.",image:"",href:""},{title:"Technology Seminar (Sample)"}),
  sample("activity-5",{title:"Volunteer Komunitas (Contoh)",dates:"2024",location:"Indonesia",description:"Data dummy untuk melihat kartu kegiatan.",image:"",href:""},{title:"Community Volunteering (Sample)"}),
]);
emptyOnly("posts", [
  sample("blog-1",{title:"Cara Memulai Proyek Data (Contoh)",slug:"contoh-memulai-proyek-data",date:"2026-10-01",description:"Tulisan contoh tentang perencanaan proyek data.",content:"# Contoh tulisan\n\nIni adalah **konten demo**, bukan artikel final. Edit melalui admin.",status:"published"},{title:"Starting a Data Project (Sample)",description:"Sample article on planning a data project."}),
  sample("blog-2",{title:"Mencatat Eksperimen ML (Contoh)",slug:"contoh-eksperimen-ml",date:"2026-09-10",description:"Tulisan contoh tentang evaluasi model.",content:"# Evaluasi model (Demo)\n\nDokumentasikan baseline, split, metrik, dan keterbatasan.",status:"published"},{title:"Tracking ML Experiments (Sample)"}),
  sample("blog-3",{title:"Membangun Portofolio (Contoh)",slug:"contoh-portofolio",date:"2026-08-14",description:"Tulisan dummy untuk desain blog.",content:"# Demo portofolio\n\nIni teks demonstrasi.",status:"published"},{title:"Building a Portfolio (Sample)"}),
]);
if (!Array.isArray(data.projects) || data.projects.length === 0) {
  data.projects = ["Data Quality Dashboard", "Sensor Monitoring", "AI Evidence Search", "Visual Inspection", "Forecast Studio", "Customer Insights"].map((title,i) => sample(`project-${i+1}`, {title: `${title} (Contoh)`,description:"Ini proyek contoh untuk pengujian desain, bukan proyek yang sudah dikerjakan.",dates:"Demo UI",technologies:["Python","Data"],href:"",repoUrl:"",image:"/demo-cover/sample.svg",video:"",evaluationUrl:"",limitations:"Belum diimplementasikan; data hanya dummy."},{title:`${title} (Sample)`,description:"Sample UI content, not a completed project."}));
}
// Replace only the empty preview covers of known roadmap proposals. Real images are untouched.
for (const project of data.projects) {
  if (/^(da10|ai01|ai02|ai03|ai04|ai05|ai06|da07|da08|da09)$/i.test(project.id)
    && !project.image && /^rencana\s*:/i.test(project.description || "")) {
    project.image = `/demo-cover/${project.id.toLowerCase()}.svg`;
    project.demo = true;
  }
}
// Preserve real roadmap proposals. Do not tag them as completed work.
if (data.profile.name === "Nama Kamu") data.profile.name = "Nama Contoh";
if (data.profile.name === "Nama Contoh" && !data.profile.email) data.profile.email = "nama@example.com";
const defaults = {
  hero: {columns:1, layout:"list", mobileColumns:1, tabletColumns:1, displayMode:"grid"},
  about: {columns:1, layout:"list", mobileColumns:1, tabletColumns:1, displayMode:"grid"},
  work: {columns:2, layout:"cards", mobileColumns:1, tabletColumns:2, displayMode:"carousel"},
  education: {columns:2, layout:"cards", mobileColumns:1, tabletColumns:2, displayMode:"grid"},
  skills: {columns:6, layout:"cards", mobileColumns:2, tabletColumns:4, displayMode:"grid"},
  projects: {columns:4, layout:"cards", mobileColumns:1, tabletColumns:2, displayMode:"carousel"},
  certifications: {columns:6, layout:"compact", mobileColumns:2, tabletColumns:3, displayMode:"carousel"},
  activities: {columns:3, layout:"cards", mobileColumns:1, tabletColumns:2, displayMode:"carousel"},
  blog: {columns:3, layout:"cards", mobileColumns:1, tabletColumns:2, displayMode:"carousel"},
  contact: {columns:1, layout:"list", mobileColumns:1, tabletColumns:1, displayMode:"grid"},
};
if (!data.sections.some(s=>s.id === "hero")) data.sections.unshift({id:"hero", title:"Profil", subtitle:"", visible:true});
for (const section of data.sections) {
  const d = defaults[section.id] ?? defaults.about;
  // Settings added in V3/V4 are initialized but user's existing custom columns/layouts win.
  section.columns ??= d.columns;
  section.layout ??= d.layout;
  section.mobileColumns ??= d.mobileColumns;
  section.tabletColumns ??= d.tabletColumns;
  section.displayMode ??= d.displayMode;
  section.pagination ??= true;
  section.autoPlay ??= true;
  section.intervalSeconds ??= 6;
  section.perPageDesktop ??= 8;
  section.perPageMobile ??= 4;
  section.subtitle ??= "";
}
// If migrating a V3 install, the section fields added only by V4 should have V4 defaults,
// while columns and layout remain the user's settings.
data.settings.faviconUrl ??= "";
data.settings.contentWidth ??= "wide";
data.settings.languagePosition ??= "top-right";
const temp = file+".v4-tmp";
fs.writeFileSync(temp,JSON.stringify(data,null,2)+"\n");
fs.renameSync(temp,file);
console.log("✅ V4 migration completed — user data preserved, sample content added to empty sections only.");
console.log("Backup:", backup);
console.log("Display modes:", data.sections.map(s=>`${s.id}:${s.displayMode}`).join(", "));
