import type { CollectionKey } from "@/lib/site-schema";

export type FieldKind = "text" | "textarea" | "markdown" | "url" | "select" | "boolean" | "tags" | "image" | "pdf" | "file" | "date" | "color";
export type FieldDef = {
  key: string;
  label: string;
  kind?: FieldKind;
  /** Boleh diisi versi English (field "en"). Nama resmi, teknologi, dan URL tidak. */
  i18n?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  help?: string;
  required?: boolean;
  wide?: boolean;
};

export type CollectionConfig = {
  title: string;
  caption: string;
  singular: string;
  idPrefix: string;
  fields: FieldDef[];
  template: Record<string, unknown>;
  /** Untuk ringkasan di daftar */
  primary: string;
  secondary?: (item: Record<string, unknown>) => string;
  thumb?: string;
};

const demo: FieldDef = { key: "demo", label: "Konten contoh (diberi label CONTOH · DEMO)", kind: "boolean", help: "Centang hanya untuk data dummy. Hapus centang setelah diganti dengan data asli." };

export const collections: Record<CollectionKey, CollectionConfig> = {
  projects: {
    title: "Proyek", singular: "proyek", idPrefix: "project", caption: "Kartu proyek di beranda dan halaman detail /projects/[id].", primary: "title", thumb: "image",
    secondary: (i) => [i.status === "completed" ? "Selesai" : i.status === "in-progress" ? "Sedang dikerjakan" : "Rencana", i.dates].filter(Boolean).join(" · "),
    fields: [
      { key: "title", label: "Judul proyek", i18n: true, required: true, wide: true },
      { key: "status", label: "Status", kind: "select", options: [{ value: "completed", label: "Selesai" }, { value: "in-progress", label: "Sedang dikerjakan" }, { value: "planned", label: "Rencana" }], help: "Jujur: jangan tandai Selesai bila belum diimplementasikan dan dievaluasi." },
      { key: "dates", label: "Periode", i18n: true, placeholder: "Okt 2026" },
      { key: "role", label: "Peran", i18n: true, placeholder: "Data Analyst (solo)" },
      { key: "description", label: "Ringkasan kartu (masalah → pendekatan → hasil)", kind: "textarea", i18n: true, required: true, wide: true },
      { key: "details", label: "Detail lengkap (Markdown, tampil di halaman detail)", kind: "markdown", i18n: true, wide: true },
      { key: "technologies", label: "Teknologi", kind: "tags", placeholder: "Python, DuckDB, React", wide: true },
      { key: "image", label: "Gambar sampul", kind: "image", help: "Rasio 16:9 disarankan (mis. 1280×720)." },
      { key: "video", label: "Video (URL .mp4/.webm, opsional)", kind: "url" },
      { key: "href", label: "Demo live", kind: "url", placeholder: "https://…" },
      { key: "repoUrl", label: "Repositori GitHub", kind: "url" },
      { key: "evaluationUrl", label: "Laporan evaluasi / metrik", kind: "url" },
      { key: "limitations", label: "Batasan & catatan jujur", kind: "textarea", i18n: true, wide: true },
      { key: "featured", label: "Proyek unggulan", kind: "boolean" },
      demo,
    ],
    template: { title: "", status: "in-progress", dates: "", role: "", description: "", details: "", technologies: [], image: "", video: "", href: "", repoUrl: "", evaluationUrl: "", limitations: "", featured: false, demo: false, hidden: false, en: {} },
  },
  work: {
    title: "Pengalaman", singular: "pengalaman", idPrefix: "work", caption: "Magang, pekerjaan, freelance, dan organisasi.", primary: "company", thumb: "logoUrl",
    secondary: (i) => [i.title, i.start && `${i.start} — ${i.end || "sekarang"}`].filter(Boolean).join(" · "),
    fields: [
      { key: "company", label: "Perusahaan / organisasi", i18n: true, required: true },
      { key: "title", label: "Posisi", i18n: true, required: true },
      { key: "type", label: "Kategori", kind: "select", options: [{ value: "Internship", label: "Magang" }, { value: "Work", label: "Kerja" }, { value: "Freelance", label: "Freelance" }, { value: "Organization", label: "Organisasi" }, { value: "Other", label: "Lainnya" }] },
      { key: "location", label: "Lokasi", i18n: true },
      { key: "start", label: "Mulai", i18n: true, placeholder: "Jan 2026" },
      { key: "end", label: "Selesai (kosong = sekarang)", i18n: true },
      { key: "description", label: "Tanggung jawab & pencapaian", kind: "textarea", i18n: true, wide: true },
      { key: "href", label: "Website", kind: "url" },
      { key: "logoUrl", label: "Logo", kind: "image" },
      demo,
    ],
    template: { company: "", title: "", type: "Internship", location: "", start: "", end: "", description: "", href: "", logoUrl: "", demo: false, hidden: false, en: {} },
  },
  education: {
    title: "Pendidikan", singular: "pendidikan", idPrefix: "edu", caption: "Riwayat pendidikan formal dan nonformal.", primary: "school", thumb: "logoUrl",
    secondary: (i) => [i.degree, i.start && `${i.start} — ${i.end}`].filter(Boolean).join(" · "),
    fields: [
      { key: "school", label: "Institusi", i18n: true, required: true },
      { key: "degree", label: "Jurusan / gelar", i18n: true, required: true },
      { key: "start", label: "Mulai" },
      { key: "end", label: "Selesai" },
      { key: "description", label: "Catatan (IPK, tugas akhir, dsb.)", kind: "textarea", i18n: true, wide: true },
      { key: "href", label: "Website institusi", kind: "url" },
      { key: "logoUrl", label: "Logo", kind: "image" },
      demo,
    ],
    template: { school: "", degree: "", start: "", end: "", description: "", href: "", logoUrl: "", demo: false, hidden: false, en: {} },
  },
  certifications: {
    title: "Sertifikasi", singular: "sertifikat", idPrefix: "cert", caption: "Sertifikat dengan gambar, PDF, dan link verifikasi.", primary: "title", thumb: "imageUrl",
    secondary: (i) => [i.issuer, i.issued].filter(Boolean).join(" · "),
    fields: [
      { key: "title", label: "Nama sertifikasi", i18n: true, required: true, wide: true },
      { key: "issuer", label: "Penerbit", i18n: true, required: true },
      { key: "issued", label: "Tanggal terbit", placeholder: "2026-05" },
      { key: "credentialId", label: "Credential ID" },
      { key: "credentialUrl", label: "URL verifikasi", kind: "url" },
      { key: "imageUrl", label: "Gambar sertifikat", kind: "image" },
      { key: "documentUrl", label: "File PDF sertifikat", kind: "pdf" },
      demo,
    ],
    template: { title: "", issuer: "", issued: "", credentialId: "", credentialUrl: "", imageUrl: "", documentUrl: "", demo: false, hidden: false, en: {} },
  },
  skills: {
    title: "Keahlian", singular: "keahlian", idPrefix: "skill", caption: "Nama teknologi tidak perlu diterjemahkan.", primary: "name",
    fields: [{ key: "name", label: "Nama keahlian / teknologi", required: true, i18n: true, help: "Isi English hanya untuk soft skill, mis. \"Komunikasi\" → \"Communication\"." }, demo],
    template: { name: "", demo: false, hidden: false, en: {} },
  },
  activities: {
    title: "Kegiatan", singular: "kegiatan", idPrefix: "activity", caption: "Hackathon, kompetisi, komunitas, seminar.", primary: "title", thumb: "image",
    secondary: (i) => [i.dates, i.location].filter(Boolean).join(" · "),
    fields: [
      { key: "title", label: "Nama kegiatan", i18n: true, required: true, wide: true },
      { key: "dates", label: "Tanggal", i18n: true },
      { key: "location", label: "Lokasi", i18n: true },
      { key: "description", label: "Cerita / hasil", kind: "textarea", i18n: true, wide: true },
      { key: "image", label: "Gambar / logo", kind: "image" },
      { key: "href", label: "Link dokumentasi", kind: "url" },
      demo,
    ],
    template: { title: "", dates: "", location: "", description: "", image: "", href: "", demo: false, hidden: false, en: {} },
  },
  posts: {
    title: "Blog", singular: "tulisan", idPrefix: "post", caption: "Tulisan Markdown. Hanya status published yang tampil.", primary: "title",
    secondary: (i) => [i.status === "published" ? "Published" : "Draft", i.date, `/blog/${i.slug}`].filter(Boolean).join(" · "),
    fields: [
      { key: "title", label: "Judul", i18n: true, required: true, wide: true },
      { key: "slug", label: "Slug URL", required: true, help: "Huruf kecil, angka, tanda -. Dibuat otomatis dari judul bila kosong." },
      { key: "date", label: "Tanggal", kind: "date", required: true },
      { key: "status", label: "Status", kind: "select", options: [{ value: "draft", label: "Draft (tidak tampil)" }, { value: "published", label: "Published" }] },
      { key: "description", label: "Ringkasan", kind: "textarea", i18n: true, wide: true },
      { key: "content", label: "Isi (Markdown)", kind: "markdown", i18n: true, wide: true },
      demo,
    ],
    template: { title: "", slug: "", date: new Date().toISOString().slice(0, 10), status: "draft", description: "", content: "", demo: false, hidden: false, en: {} },
  },
  socialLinks: {
    title: "Media sosial", singular: "tautan", idPrefix: "social", caption: "Tampil di bagian Kontak, dan di dock bawah bila dicentang.", primary: "label",
    secondary: (i) => String(i.href || ""),
    fields: [
      { key: "label", label: "Nama platform", required: true },
      { key: "href", label: "URL", kind: "url", required: true, placeholder: "https://github.com/…" },
      { key: "icon", label: "Ikon", kind: "select", options: ["github", "linkedin", "twitter", "instagram", "youtube", "globe", "mail", "external"].map((v) => ({ value: v, label: v })) },
      { key: "dock", label: "Tampilkan di dock bawah", kind: "boolean" },
    ],
    template: { label: "GitHub", href: "", icon: "github", dock: true, hidden: false, en: {} },
  },
};

export const profileFields: FieldDef[] = [
  { key: "name", label: "Nama tampil", required: true },
  { key: "headline", label: "Profesi / headline", i18n: true, required: true },
  { key: "description", label: "Deskripsi singkat (hero)", kind: "textarea", i18n: true, required: true, wide: true },
  { key: "summary", label: "Tentang saya (Markdown)", kind: "markdown", i18n: true, wide: true },
  { key: "location", label: "Lokasi", i18n: true },
  { key: "locationUrl", label: "Link lokasi (Google Maps)", kind: "url" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Telepon / WhatsApp" },
  { key: "avatarUrl", label: "Foto profil", kind: "image", help: "Persegi, minimal 400×400." },
  { key: "cvUrl", label: "CV / resume (PDF)", kind: "pdf" },
];

export const contactFields: FieldDef[] = [
  { key: "introGreeting", label: "Sapaan di hero", i18n: true, placeholder: "Halo, saya" },
  { key: "contactHeading", label: "Judul ajakan kontak", i18n: true },
  { key: "contactText", label: "Teks kontak", kind: "textarea", i18n: true, wide: true },
];

export const seoFields: FieldDef[] = [
  { key: "seoTitle", label: "Judul SEO (kosong = nama)", wide: true },
  { key: "seoDescription", label: "Deskripsi SEO (kosong = deskripsi singkat)", kind: "textarea", wide: true, help: "Ideal 120–160 karakter." },
  { key: "seoKeywords", label: "Kata kunci", kind: "tags", wide: true, placeholder: "data analyst, machine learning, portfolio" },
  { key: "faviconUrl", label: "Favicon", kind: "image", help: "PNG persegi 64×64 atau ICO." },
  { key: "ogImageUrl", label: "Gambar pratinjau share (Open Graph)", kind: "image", help: "1200×630. Kosong = gambar otomatis." },
];
