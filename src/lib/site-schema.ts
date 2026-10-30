import { z } from "zod";

/*
 * Skema konten portofolio (src/data/site.json).
 *
 * Aturan kompatibilitas:
 * - Semua field yang ditambahkan setelah V4 punya nilai default, jadi file lama tetap valid.
 * - Objek memakai looseObject: field yang tidak dikenal (mis. "status" lama atau
 *   "showPlannedProjects") tetap disimpan, tidak dibuang saat admin menyimpan.
 * - normalizeSite() melengkapi bagian (section) yang hilang sebelum validasi.
 * File ini sengaja hanya bergantung pada zod supaya bisa diuji langsung dengan Node.
 */

const short = z.string().max(240);
const prose = z.string().max(20000);
const url = z.string().max(1000).refine(
  (v) => !v || v.startsWith("/") || /^https?:\/\//i.test(v) || /^mailto:/i.test(v) || /^tel:/i.test(v),
  "Gunakan URL http(s), mailto:, tel:, atau path lokal yang diawali /",
);
const id = z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/, "ID hanya huruf, angka, - dan _");
const translations = z.record(z.string(), prose).optional();
const base = { id, en: translations, demo: z.boolean().optional(), hidden: z.boolean().default(false) };

export const SECTION_IDS = ["hero", "about", "work", "education", "skills", "projects", "certifications", "activities", "blog", "contact"] as const;
export type SectionId = (typeof SECTION_IDS)[number];
export const DISPLAY_MODES = ["carousel", "grid", "pages"] as const;
export const PROJECT_STATUSES = ["planned", "in-progress", "completed"] as const;

const sectionSchema = z.looseObject({
  id: z.enum(SECTION_IDS),
  title: short,
  subtitle: prose.default(""),
  visible: z.boolean().default(true),
  layout: z.enum(["list", "cards", "compact"]).default("list"),
  columns: z.number().int().min(1).max(6).default(1),
  tabletColumns: z.number().int().min(1).max(4).default(2),
  mobileColumns: z.number().int().min(1).max(2).default(1),
  displayMode: z.enum(DISPLAY_MODES).default("grid"),
  pagination: z.boolean().default(true),
  autoPlay: z.boolean().default(true),
  intervalSeconds: z.number().int().min(3).max(20).default(6),
  perPageDesktop: z.number().int().min(1).max(48).default(8),
  perPageMobile: z.number().int().min(1).max(24).default(4),
  /** Batas item yang tampil sebelum tombol "Lihat semua" (0 = semua). */
  maxItems: z.number().int().min(0).max(200).default(0),
  en: translations,
});

export const siteSchema = z.looseObject({
  profile: z.looseObject({
    name: short, headline: short, description: prose, summary: prose,
    location: short.default(""), locationUrl: url.default(""), avatarUrl: url.default(""), cvUrl: url.default(""),
    email: z.string().max(254).default(""), phone: short.default(""), siteUrl: url.default(""), en: translations,
  }),
  socialLinks: z.array(z.looseObject({ ...base, label: short, href: url, icon: z.enum(["github", "linkedin", "twitter", "instagram", "youtube", "globe", "mail", "external"]), dock: z.boolean().default(true) })).max(30),
  skills: z.array(z.looseObject({ ...base, name: short })).max(150),
  work: z.array(z.looseObject({ ...base, company: short, title: short, type: z.enum(["Internship", "Work", "Freelance", "Organization", "Other"]), location: short.default(""), start: short.default(""), end: short.default(""), description: prose.default(""), href: url.default(""), logoUrl: url.default("") })).max(150),
  education: z.array(z.looseObject({ ...base, school: short, degree: short, start: short.default(""), end: short.default(""), description: prose.default(""), href: url.default(""), logoUrl: url.default("") })).max(100),
  projects: z.array(z.looseObject({
    ...base, title: short, description: prose, dates: short.default(""), technologies: z.array(short).max(30).default([]),
    href: url.default(""), repoUrl: url.default(""), image: url.default(""), video: url.default(""), evaluationUrl: url.default(""), limitations: prose.default(""),
    status: z.enum(PROJECT_STATUSES).default("completed"),
    role: short.default(""), details: prose.default(""), featured: z.boolean().default(false),
  })).max(200),
  certifications: z.array(z.looseObject({ ...base, title: short, issuer: short, issued: short.default(""), credentialId: short.default(""), credentialUrl: url.default(""), imageUrl: url.default(""), documentUrl: url.default("") })).max(150),
  activities: z.array(z.looseObject({ ...base, title: short, dates: short.default(""), location: short.default(""), description: prose.default(""), image: url.default(""), href: url.default("") })).max(150),
  posts: z.array(z.looseObject({ ...base, title: short, slug: z.string().max(120).regex(/^[a-z0-9-]*$/, "Slug hanya huruf kecil, angka dan -"), date: short, description: prose.default(""), content: prose.default(""), status: z.enum(["draft", "published"]).default("draft") })).max(150),
  sections: z.array(sectionSchema).min(1).max(SECTION_IDS.length),
  settings: z.looseObject({
    contactHeading: short.default(""), contactText: prose.default(""), introGreeting: short.default(""),
    accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Warna harus format #RRGGBB").default("#2563eb"),
    faviconUrl: url.default(""),
    contentWidth: z.enum(["medium", "wide", "full"]).default("wide"),
    languagePosition: z.enum(["top-right", "top-left"]).default("top-right"),
    defaultLanguage: z.enum(["id", "en"]).default("id"),
    defaultTheme: z.enum(["light", "dark", "system"]).default("light"),
    animation: z.enum(["full", "subtle", "off"]).default("full"),
    radius: z.enum(["sharp", "normal", "round"]).default("normal"),
    backgroundGrid: z.boolean().default(true),
    showDemoBanner: z.boolean().default(true),
    seoTitle: short.default(""), seoDescription: prose.default(""), seoKeywords: z.array(short).max(30).default([]), ogImageUrl: url.default(""),
    en: translations,
  }),
}).superRefine((data, ctx) => {
  const sectionIDs = data.sections.map((s) => s.id);
  if (new Set(sectionIDs).size !== sectionIDs.length) ctx.addIssue({ code: "custom", message: "ID section ganda", path: ["sections"] });
  const slugs = data.posts.filter((p) => p.status === "published").map((p) => p.slug);
  if (new Set(slugs).size !== slugs.length || slugs.includes("")) ctx.addIssue({ code: "custom", message: "Slug blog yang published harus unik dan tidak kosong", path: ["posts"] });
  for (const key of COLLECTION_KEYS) {
    const vals = data[key].map((entry) => entry.id);
    if (new Set(vals).size !== vals.length) ctx.addIssue({ code: "custom", message: `ID ganda di ${key}`, path: [key] });
  }
});

export type SiteData = z.infer<typeof siteSchema>;
export type SiteInput = z.input<typeof siteSchema>;
export type Section = SiteData["sections"][number];
export const COLLECTION_KEYS = ["socialLinks", "skills", "work", "education", "projects", "certifications", "activities", "posts"] as const;
export type CollectionKey = (typeof COLLECTION_KEYS)[number];

/** Default per section, dipakai untuk melengkapi file lama yang belum punya section tertentu. */
export const SECTION_DEFAULTS: Record<SectionId, Partial<Section> & { title: string }> = {
  hero: { title: "Profil", layout: "list", columns: 1, tabletColumns: 1, mobileColumns: 1, displayMode: "grid" },
  about: { title: "Tentang Saya", layout: "list", columns: 1, tabletColumns: 1, mobileColumns: 1, displayMode: "grid" },
  work: { title: "Pengalaman", layout: "cards", columns: 2, tabletColumns: 2, mobileColumns: 1, displayMode: "carousel" },
  education: { title: "Pendidikan", layout: "cards", columns: 2, tabletColumns: 2, mobileColumns: 1, displayMode: "grid" },
  skills: { title: "Keahlian", layout: "cards", columns: 6, tabletColumns: 4, mobileColumns: 2, displayMode: "grid" },
  projects: { title: "Proyek", layout: "cards", columns: 4, tabletColumns: 2, mobileColumns: 1, displayMode: "carousel" },
  certifications: { title: "Sertifikasi", layout: "compact", columns: 6, tabletColumns: 3, mobileColumns: 2, displayMode: "carousel" },
  activities: { title: "Kegiatan", layout: "cards", columns: 3, tabletColumns: 2, mobileColumns: 1, displayMode: "carousel" },
  blog: { title: "Tulisan", layout: "cards", columns: 3, tabletColumns: 2, mobileColumns: 1, displayMode: "grid", visible: false },
  contact: { title: "Kontak", layout: "list", columns: 1, tabletColumns: 1, mobileColumns: 1, displayMode: "grid" },
};

type Loose = Record<string, unknown>;
const isObj = (v: unknown): v is Loose => typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * Lengkapi data lama (V2/V3/V4) supaya lolos skema terbaru tanpa membuang isi pengguna.
 * Tidak mengubah objek masukan.
 */
export function prepareSite(raw: unknown): Loose {
  if (!isObj(raw)) throw new Error("site.json harus berupa objek JSON");
  const data: Loose = structuredClone(raw);
  if (!isObj(data.profile)) throw new Error("site.json tidak memiliki bagian profile");
  data.settings = isObj(data.settings) ? data.settings : {};
  for (const key of COLLECTION_KEYS) if (!Array.isArray(data[key])) data[key] = [];
  const known = new Set<string>(SECTION_IDS);
  const sections = (Array.isArray(data.sections) ? data.sections : []).filter((s): s is Loose => isObj(s) && known.has(String(s.id)));
  const seen = new Set(sections.map((s) => String(s.id)));
  for (const sid of SECTION_IDS) {
    if (seen.has(sid)) continue;
    const def = { id: sid, subtitle: "", visible: true, ...SECTION_DEFAULTS[sid] };
    // hero selalu di atas, sisanya ditambahkan di akhir supaya urutan pengguna tidak berubah
    if (sid === "hero") sections.unshift(def); else sections.push(def);
  }
  data.sections = sections.map((s) => {
    const sid = String(s.id) as SectionId;
    const def = SECTION_DEFAULTS[sid];
    return { ...def, ...s, title: typeof s.title === "string" && s.title ? s.title : def.title };
  });
  return data;
}

export function parseSite(raw: unknown) {
  return siteSchema.safeParse(prepareSite(raw));
}

export function normalizeSite(raw: unknown): SiteData {
  const result = parseSite(raw);
  if (!result.success) {
    const detail = result.error.issues.slice(0, 8).map((e) => `${e.path.join(".")}: ${e.message}`).join("\n");
    throw new Error(`src/data/site.json tidak valid:\n${detail}`);
  }
  return result.data;
}

export function formatIssues(error: z.ZodError, limit = 6) {
  return error.issues.slice(0, limit).map((e) => `${e.path.join(".") || "(root)"}: ${e.message}`);
}
