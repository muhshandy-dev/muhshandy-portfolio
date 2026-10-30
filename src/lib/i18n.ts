export type Language = "id" | "en";
export const LANGUAGES: Language[] = ["id", "en"];

/*
 * Semua teks antarmuka publik. Konten dari admin diterjemahkan lewat field "en" per item
 * (lihat translated()). Nama teknologi, URL dan nama resmi tidak diterjemahkan.
 */
const dict = {
  skipToContent: { id: "Lewati ke konten utama", en: "Skip to main content" },
  selectLanguage: { id: "Pilih bahasa", en: "Select language" },
  langId: { id: "Bahasa Indonesia", en: "Indonesian" },
  langEn: { id: "Bahasa Inggris", en: "English" },
  mainNav: { id: "Navigasi utama", en: "Main navigation" },
  sectionNav: { id: "Navigasi bagian halaman", en: "Page sections" },
  jumpTo: { id: "Langsung ke bagian", en: "Jump to section" },
  explore: { id: "Jelajahi bagian", en: "Browse sections" },
  home: { id: "Beranda", en: "Home" },
  blog: { id: "Blog", en: "Blog" },
  backToTop: { id: "Kembali ke atas", en: "Back to top" },
  toggleTheme: { id: "Ganti mode terang/gelap", en: "Toggle light/dark mode" },
  closeMenu: { id: "Tutup menu", en: "Close menu" },
  demoBanner: {
    id: "Mode contoh: item berlabel CONTOH · DEMO hanya untuk pratinjau desain, bukan riwayat, proyek, atau sertifikat asli. Ganti atau hapus melalui admin sebelum dipublikasikan.",
    en: "Sample mode: items labelled SAMPLE · DEMO only preview the layout. They are not real experience, projects, or credentials. Replace or remove them in Admin before publishing.",
  },
  demoLabel: { id: "CONTOH · DEMO", en: "SAMPLE · DEMO" },
  previewBanner: { id: "PRATINJAU — perubahan ini belum dipublikasikan", en: "PREVIEW — these changes are not published yet" },
  viewCv: { id: "Lihat CV", en: "View résumé" },
  emailMe: { id: "Kirim email", en: "Email me" },
  present: { id: "Sekarang", en: "Present" },
  previous: { id: "Sebelumnya", en: "Previous" },
  next: { id: "Berikutnya", en: "Next" },
  pause: { id: "Jeda putar otomatis", en: "Pause autoplay" },
  play: { id: "Putar otomatis", en: "Play autoplay" },
  viewAll: { id: "Lihat semua", en: "View all" },
  showLess: { id: "Tampilkan lebih sedikit", en: "Show less" },
  backToCarousel: { id: "Kembali ke carousel", en: "Back to carousel" },
  page: { id: "Halaman", en: "Page" },
  pages: { id: "Halaman", en: "Pages" },
  slideOf: { id: "Menampilkan {from}–{to} dari {total}", en: "Showing {from}–{to} of {total}" },
  carouselOf: { id: "Carousel {name}", en: "{name} carousel" },
  verify: { id: "Verifikasi", en: "Verify" },
  document: { id: "Dokumen", en: "Document" },
  code: { id: "Kode", en: "Code" },
  demo: { id: "Demo", en: "Demo" },
  results: { id: "Evaluasi", en: "Results" },
  details: { id: "Detail", en: "Details" },
  projectDetails: { id: "Detail proyek", en: "Project details" },
  noProjects: { id: "Proyek akan muncul di sini setelah ditambahkan.", en: "Projects will appear here when added." },
  allPosts: { id: "Semua tulisan", en: "All posts" },
  postsCount: { id: "{n} tulisan", en: "{n} posts" },
  noPosts: { id: "Belum ada tulisan yang dipublikasikan.", en: "No published posts yet." },
  writing: { id: "Tulisan", en: "Writing" },
  limitations: { id: "Batasan & catatan jujur", en: "Limitations" },
  technologies: { id: "Teknologi", en: "Technologies" },
  role: { id: "Peran", en: "Role" },
  period: { id: "Periode", en: "Period" },
  status: { id: "Status", en: "Status" },
  "status.planned": { id: "Rencana", en: "Planned" },
  "status.in-progress": { id: "Sedang dikerjakan", en: "In progress" },
  "status.completed": { id: "Selesai", en: "Completed" },
  "type.Internship": { id: "Magang", en: "Internship" },
  "type.Work": { id: "Kerja", en: "Work" },
  "type.Freelance": { id: "Freelance", en: "Freelance" },
  "type.Organization": { id: "Organisasi", en: "Organization" },
  "type.Other": { id: "Lainnya", en: "Other" },
  builtWith: { id: "Dibangun dengan Next.js & Magic UI", en: "Built with Next.js & Magic UI" },
  notFoundTitle: { id: "Halaman tidak ditemukan", en: "Page not found" },
  notFoundText: { id: "Halaman yang kamu cari tidak ada atau sudah dipindahkan.", en: "The page you're looking for doesn't exist or was moved." },
  goHome: { id: "Ke beranda", en: "Go home" },
  backToProjects: { id: "Kembali ke proyek", en: "Back to projects" },
  socials: { id: "Temukan saya di", en: "Find me on" },
} as const;

export type MessageKey = keyof typeof dict;

export function translate(lang: Language, key: MessageKey, vars?: Record<string, string | number>) {
  const entry = dict[key];
  let text: string = entry?.[lang] ?? entry?.id ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) text = text.replaceAll(`{${k}}`, String(v));
  return text;
}

/** Ambil teks konten dalam bahasa aktif dengan fallback ke Bahasa Indonesia. */
export function translated<T extends { en?: Record<string, string> }>(obj: T, key: keyof T & string, lang: Language): string {
  const original = obj[key];
  const english = obj.en?.[key];
  return lang === "en" && typeof english === "string" && english.trim() ? english : String(original ?? "");
}
