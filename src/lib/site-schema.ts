import { z } from "zod";

const short = z.string().max(240);
const prose = z.string().max(16000);
const url = z.string().max(1000).refine((v) => !v || v.startsWith('/') || /^https?:\/\//i.test(v) || /^mailto:/i.test(v) || /^tel:/i.test(v), "Use an HTTP(S), mailto, tel, or local path URL");
const id = z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/);
const translations = z.record(z.string(), prose).optional();
const base = z.object({ id, en: translations, demo: z.boolean().optional() });

export const siteSchema = z.object({
  profile: z.object({
    name: short, headline: short, description: prose, summary: prose,
    location: short, locationUrl: url, avatarUrl: url, cvUrl: url,
    email: z.string().max(254), phone: short, siteUrl: url, en: translations,
  }),
  socialLinks: z.array(base.extend({ label: short, href: url, icon: z.enum(["github", "linkedin", "twitter", "instagram", "youtube", "globe", "mail", "external"]), dock: z.boolean() })).max(30),
  skills: z.array(base.extend({ name: short })).max(150),
  work: z.array(base.extend({ company: short, title: short, type: z.enum(["Internship", "Work", "Freelance", "Organization", "Other"]), location: short, start: short, end: short, description: prose, href: url, logoUrl: url })).max(150),
  education: z.array(base.extend({ school: short, degree: short, start: short, end: short, href: url, logoUrl: url })).max(100),
  projects: z.array(base.extend({ title: short, description: prose, dates: short, technologies: z.array(short).max(30), href: url, repoUrl: url, image: url, video: url, evaluationUrl: url, limitations: prose })).max(200),
  certifications: z.array(base.extend({ title: short, issuer: short, issued: short, credentialId: short, credentialUrl: url, imageUrl: url, documentUrl: url })).max(150),
  activities: z.array(base.extend({ title: short, dates: short, location: short, description: prose, image: url, href: url })).max(150),
  posts: z.array(base.extend({ title: short, slug: z.string().max(120).regex(/^[a-z0-9-]*$/), date: short, description: prose, content: prose, status: z.enum(["draft", "published"]) })).max(150),
  sections: z.array(z.object({ id: z.enum(["hero", "about", "work", "education", "skills", "projects", "certifications", "activities", "blog", "contact"]), title: short, subtitle: prose, visible: z.boolean(), columns: z.number().int().min(1).max(6).default(1), layout: z.enum(["list", "cards", "compact"]).default("list"), mobileColumns: z.number().int().min(1).max(2).default(1), tabletColumns: z.number().int().min(1).max(3).default(2), pagination: z.boolean().default(true), displayMode: z.enum(["carousel", "pages", "grid"]).default("grid"), autoPlay: z.boolean().default(true), intervalSeconds: z.number().int().min(3).max(20).default(6), perPageDesktop: z.number().int().min(1).max(48).default(8), perPageMobile: z.number().int().min(1).max(24).default(4), en: translations })).length(10),
  settings: z.object({ contactHeading: short, contactText: prose, introGreeting: short, accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/), faviconUrl: url.default(""), contentWidth: z.enum(["medium", "wide", "full"]).default("wide"), languagePosition: z.enum(["top-right", "top-left"]).default("top-right"), en: translations }),
}).superRefine((data, ctx) => {
  const sectionIDs = data.sections.map((s) => s.id);
  if (new Set(sectionIDs).size !== sectionIDs.length) ctx.addIssue({ code: "custom", message: "Duplicate section IDs", path: ["sections"] });
  const slugs = data.posts.filter((p) => p.status === "published").map((p) => p.slug);
  if (new Set(slugs).size !== slugs.length || slugs.includes("")) ctx.addIssue({ code: "custom", message: "Published blog slugs must be unique and nonempty", path: ["posts"] });
  for (const key of ["socialLinks", "skills", "work", "education", "projects", "certifications", "activities", "posts"] as const) {
    const vals = data[key].map((entry) => entry.id);
    if (new Set(vals).size !== vals.length) ctx.addIssue({ code: "custom", message: `Duplicate IDs in ${key}`, path: [key] });
  }
});

export type SiteData = z.infer<typeof siteSchema>;
export type CollectionKey = "socialLinks" | "skills" | "work" | "education" | "projects" | "certifications" | "activities" | "posts";
