"use client";
/* eslint-disable @next/next/no-img-element */
import BlurFade from "@/components/magicui/blur-fade";
import BlurFadeText from "@/components/magicui/blur-fade-text";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProjectCard } from "@/components/project-card";
import { ArrowUpRight, Github, Globe, MapPin, Mail, FileText, ChevronLeft, ChevronRight, Pause, Play, LayoutGrid } from "lucide-react";
import { site, publicProjects } from "@/lib/site";
import { useLocale, translated } from "@/components/locale-provider";
import type { SiteData } from "@/lib/site-schema";
import { Children, useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import Markdown from "react-markdown";

type Section = SiteData["sections"][number];
const fade = 0.04;
const styleFor = (s: Section) => ({
  "--portfolio-cols": (s.layout === "list" && s.id !== "skills") ? 1 : s.columns,
  "--portfolio-cols-mobile": (s.layout === "list" && s.id !== "skills") ? 1 : s.mobileColumns,
  "--portfolio-cols-tablet": (s.layout === "list" && s.id !== "skills") ? 1 : s.tabletColumns,
} as CSSProperties);
type Viewport = "mobile" | "tablet" | "desktop";
function subscribeViewport(callback: () => void) {
  window.addEventListener("resize", callback);
  return () => window.removeEventListener("resize", callback);
}
function getViewport(): Viewport {
  return window.innerWidth < 768 ? "mobile" : window.innerWidth < 1024 ? "tablet" : "desktop";
}
function Grid({ section, children }: { section: Section; children: ReactNode }) {
  const { language } = useLocale();
  const viewport = useSyncExternalStore(subscribeViewport, getViewport, () => "desktop" as Viewport);
  const isMobile = viewport === "mobile";
  const cols = section.layout === "list" && section.id !== "skills" ? 1 :
    viewport === "mobile" ? section.mobileColumns : viewport === "tablet" ? section.tabletColumns : section.columns;
  const items = Children.toArray(children);
  const [page, setPage] = useState(1);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [inView, setInView] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const mode = section.displayMode || "grid";
  const carousel = mode === "carousel" && !expanded;
  const pageSize = section.pagination && mode === "pages" && !expanded ? (isMobile ? section.perPageMobile : section.perPageDesktop) : Math.max(items.length, 1);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const maxIndex = Math.max(0, items.length - Math.min(cols, items.length));
  const currentIndex = Math.min(index, maxIndex);
  const reducedMotion = useSyncExternalStore((cb) => { const media = window.matchMedia("(prefers-reduced-motion: reduce)"); media.addEventListener("change", cb); return () => media.removeEventListener("change", cb); }, () => window.matchMedia("(prefers-reduced-motion: reduce)").matches, () => true);
  const [visible, setVisible] = useState(true);
  useEffect(() => { if (!root.current || !carousel) return; const observer = new IntersectionObserver(([entry]) => setInView(Boolean(entry?.isIntersecting)), {threshold: 0.25}); observer.observe(root.current); return () => observer.disconnect(); }, [carousel]);
  useEffect(() => { if (!carousel) return; const onVisibility = () => setVisible(!document.hidden); onVisibility(); document.addEventListener("visibilitychange", onVisibility); return () => document.removeEventListener("visibilitychange", onVisibility); }, [carousel]);
  useEffect(() => { if (!carousel || !track.current) return; const item = track.current.children[currentIndex] as HTMLElement | undefined; if (!item) return;
    // Avoid scrolling the whole page: only the horizontal carousel track moves.
    track.current.scrollTo({ left: item.offsetLeft - (track.current.children[0] as HTMLElement).offsetLeft, behavior: reducedMotion ? "instant" : "smooth" });
  }, [currentIndex, carousel, cols, reducedMotion]);
  useEffect(() => { if (!carousel || !section.autoPlay || reducedMotion || !inView || !visible || paused || userPaused || maxIndex === 0) return;
    const timer = window.setInterval(() => setIndex(i => i >= maxIndex ? 0 : i + 1), section.intervalSeconds * 1000);
    return () => window.clearInterval(timer);
  }, [carousel, section.autoPlay, section.intervalSeconds, reducedMotion, inView, visible, paused, userPaused, maxIndex]);
  useEffect(() => { if (page > pageCount) setPage(pageCount); }, [page, pageCount]);
  useEffect(() => { if (index > maxIndex) setIndex(maxIndex); }, [index, maxIndex]);
  const visibleItems = mode === "pages" && !expanded ? items.slice((currentPage - 1) * pageSize, currentPage * pageSize) : items;
  const goPage = (next: number) => { if (next < 1 || next > pageCount || next === currentPage) return; setPage(next); root.current?.closest("section")?.scrollIntoView({ behavior: reducedMotion ? "instant" : "smooth", block: "start" }); };
  const pagingNumbers = Array.from({length: Math.min(5, pageCount)}, (_,i) => Math.max(1, Math.min(currentPage-2, pageCount-4)) + i);
  return <div ref={root} className="space-y-4">
    {carousel ? <div className="portfolio-carousel-wrap" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={e => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPaused(false); }} onTouchStart={() => setPaused(true)} onTouchEnd={() => setPaused(false)}>
      <div className="portfolio-carousel-track" ref={track} data-section={section.id} data-density={section.layout === "compact" ? "compact" : "normal"} style={styleFor(section)} role="region" aria-roledescription="carousel" aria-label={language === "id" ? `Kumpulan ${section.title}` : `${section.title} carousel`}>
        {items.map((item,i) => <div className="portfolio-carousel-cell" key={i}>{item}</div>)}
      </div>
      {maxIndex > 0 && <div className="portfolio-carousel-controls">
        <div className="flex items-center gap-2">
          <button type="button" className="pager-button" onClick={() => setIndex(i => i <= 0 ? maxIndex : i-1)} aria-label={language === "id" ? "Kartu sebelumnya" : "Previous card"}><ChevronLeft className="size-4" /></button>
          <button type="button" className="pager-button" onClick={() => setIndex(i => i >= maxIndex ? 0 : i+1)} aria-label={language === "id" ? "Kartu berikutnya" : "Next card"}><ChevronRight className="size-4" /></button>
          {section.autoPlay && !reducedMotion && <button type="button" className="pager-button" aria-label={userPaused ? (language === "id" ? "Lanjutkan putar otomatis" : "Resume autoplay") : (language === "id" ? "Hentikan putar otomatis" : "Pause autoplay")} onClick={() => setUserPaused(v => !v)}>{userPaused ? <Play className="size-4" /> : <Pause className="size-4"/>}</button>}
        </div>
        <span className="text-xs text-muted-foreground" aria-live="off">{currentIndex+1}–{Math.min(currentIndex+cols, items.length)} / {items.length}</span>
        <button type="button" className="portfolio-view-all" onClick={() => { setExpanded(true); setUserPaused(true); }}>{language === "id" ? "Lihat semua" : "View all"}<LayoutGrid className="size-4" /></button>
      </div>}
    </div> : <>
      <div className="portfolio-grid" data-section={section.id} data-style={section.layout} data-density={section.layout === "compact" ? "compact" : "normal"} style={styleFor(section)}>{visibleItems}</div>
      {expanded && mode === "carousel" && <button type="button" className="portfolio-view-all" onClick={() => { setExpanded(false); setIndex(0); }}>{language === "id" ? "Kembali ke carousel" : "Back to carousel"}</button>}
      {mode === "pages" && !expanded && pageCount > 1 && <nav className="portfolio-pager" aria-label={`${language === "id" ? "Halaman" : "Pages"} ${section.title}`}>
        <button type="button" className="pager-button" onClick={() => goPage(currentPage-1)} disabled={currentPage===1}>‹</button>
        {pagingNumbers.map(n => <button key={n} type="button" className="pager-button" aria-current={n === currentPage ? "page" : undefined} onClick={() => goPage(n)}>{n}</button>)}
        <button type="button" className="pager-button" onClick={() => goPage(currentPage+1)} disabled={currentPage===pageCount}>›</button>
        <span className="text-xs text-muted-foreground">{currentPage} / {pageCount}</span>
      </nav>}
    </>}
  </div>;
}
function DemoBadge({ demo }: { demo?: boolean }) {
  const { language } = useLocale();
  return demo ? <span className="demo-label">{language === "id" ? "DATA CONTOH" : "SAMPLE DATA"}</span> : null;
}
function Heading({ section }: { section: Section }) {
  const { language } = useLocale();
  return <div className="space-y-1"><h2 className="text-xl sm:text-2xl font-bold tracking-tight">{translated(section, "title", language)}</h2>{section.subtitle && <p className="text-sm text-muted-foreground">{translated(section, "subtitle", language)}</p>}</div>;
}
function ListLogo({ src, alt }: { src: string; alt: string }) {
  return src ? <img src={src} alt={alt} className="size-10 rounded-xl border object-contain p-1 flex-none"/> : <div aria-hidden="true" className="size-10 rounded-xl border bg-muted flex-none"/>;
}
function External({ url, children }: { url: string; children: ReactNode }) {
  return url ? <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline-offset-2 hover:underline focus-visible:underline">{children}<ArrowUpRight className="size-3 shrink-0"/></a> : <>{children}</>;
}
function Hero({ section }: { section: Section }) {
  const { language } = useLocale(); const p = site.profile;
  return <section id="hero" className={`space-y-6 ${section.layout === "compact" ? "mx-auto max-w-3xl text-center" : ""}`}>
    <div className={`flex gap-6 ${section.layout === "compact" ? "flex-col-reverse items-center" : "flex-col-reverse sm:flex-row justify-between items-start"}`}>
      <div className="space-y-3 max-w-3xl min-w-0"><BlurFadeText delay={fade} className="text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl" yOffset={8} text={`${translated(site.settings, "introGreeting", language)} ${p.name}`}/><BlurFadeText delay={fade * 2} className="font-semibold text-sm sm:text-base" text={translated(p, "headline", language)}/>
        <p className="text-muted-foreground text-base sm:text-lg">{translated(p, "description", language)}</p>
        {p.location && <p className={`text-muted-foreground text-xs flex items-center gap-1 ${section.layout === "compact" ? "justify-center" : ""}`}><MapPin className="size-3"/>{translated(p, "location", language)}</p>}
        {p.cvUrl && <a href={p.cvUrl} target="_blank" rel="noopener noreferrer" className="text-sm inline-flex gap-1 items-center underline underline-offset-4"><FileText className="size-4"/>{language === "id" ? "Lihat CV" : "View résumé"}</a>}
      </div><BlurFade delay={fade}><Avatar className="size-24 sm:size-32 border rounded-full shadow-lg ring-4 ring-muted"><AvatarImage alt={p.name} src={p.avatarUrl}/><AvatarFallback>{p.name.slice(0,2).toUpperCase()}</AvatarFallback></Avatar></BlurFade>
    </div>
  </section>;
}
function DisplaySection({ section }: { section: Section }) {
  const { language } = useLocale(); const en = language === "en";
  switch (section.id) {
    case "hero": return <Hero section={section}/>;
    case "about": return <section id="about" className="space-y-4"><Heading section={section}/><div className={`prose max-w-4xl text-pretty text-sm leading-relaxed text-muted-foreground dark:prose-invert ${section.layout === "cards" ? "rounded-2xl border bg-card p-5" : ""}`}><Markdown>{translated(site.profile, "summary", language)}</Markdown></div></section>;
    case "work": if (!site.work.length) return null; return <section id="work" className="space-y-5"><Heading section={section}/><Grid section={section}>{site.work.map((w) => <article key={w.id} className={`portfolio-card flex items-start gap-3 ${section.layout !== "list" ? "rounded-2xl border bg-card p-4" : ""}`}><ListLogo src={w.logoUrl} alt={w.company}/><div className="min-w-0 flex-1"><DemoBadge demo={w.demo}/><div className="flex flex-wrap justify-between gap-1"><h3 className="text-sm font-semibold"><External url={w.href}>{translated(w, "company", language)}</External></h3><span className="text-xs text-muted-foreground">{translated(w, "start", language)} — {translated(w, "end", language) || (en ? "Present" : "Sekarang")}</span></div><p className="text-xs text-muted-foreground">{translated(w, "title", language)} · {en ? ({ Internship: "Internship", Work: "Work", Freelance: "Freelance", Organization: "Organization", Other: "Other" }[w.type]) : ({ Internship: "Magang", Work: "Kerja", Freelance: "Freelance", Organization: "Organisasi", Other: "Lainnya" }[w.type])}{w.location ? ` · ${translated(w, "location", language)}` : ""}</p><p className="whitespace-pre-wrap text-sm text-muted-foreground mt-2">{translated(w, "description", language)}</p></div></article>)}</Grid></section>;
    case "education": if (!site.education.length) return null; return <section id="education" className="space-y-5"><Heading section={section}/><Grid section={section}>{site.education.map((item) => <article key={item.id} className={`portfolio-card flex gap-3 items-start ${section.layout !== "list" ? "rounded-2xl border bg-card p-4" : ""}`}><ListLogo src={item.logoUrl} alt={item.school}/><div className="flex-1 min-w-0"><DemoBadge demo={item.demo}/><h3 className="font-semibold text-sm"><External url={item.href}>{translated(item, "school", language)}</External></h3><p className="text-xs text-muted-foreground">{translated(item, "degree", language)}</p><span className="text-xs text-muted-foreground">{item.start} — {item.end}</span></div></article>)}</Grid></section>;
    case "skills": if (!site.skills.length) return null; return <section id="skills" className="space-y-4"><Heading section={section}/><Grid section={section}>{site.skills.map(skill => <span key={skill.id} className="portfolio-card rounded-xl border bg-card px-3 py-2 text-sm font-medium text-center">{translated(skill,"name", language)}{skill.demo && <span className="block text-[10px] opacity-60">DEMO</span>}</span>)}</Grid></section>;
    case "projects": {
      const projects = publicProjects();
      return <section id="projects" className="space-y-6"><div className="space-y-2"><Heading section={section}/></div>
        {projects.length ? <Grid section={section}>{projects.map((p) => <div key={p.id} className="relative h-full">{p.demo && <span className="demo-label absolute left-2 top-2 z-10">DEMO</span>}<ProjectCard compact={section.layout === "compact"} title={translated(p,"title", language)} description={translated(p,"description",language)} dates={translated(p,"dates",language)} href={p.href || p.repoUrl} tags={p.technologies} image={p.image} video={p.video} links={[
          ...(p.repoUrl ? [{ type: "Code", href: p.repoUrl, icon: <Github className="size-3"/> }] : []),
          ...(p.evaluationUrl ? [{ type: en ? "Results" : "Evaluasi", href: p.evaluationUrl, icon: <FileText className="size-3"/> }] : []),
          ...(p.href ? [{ type: "Demo", href: p.href, icon: <Globe className="size-3"/> }] : []),
        ]}/></div>)}</Grid> : <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">{en ? "Projects will appear here when added." : "Proyek akan muncul di sini setelah ditambahkan."}</p>}
      </section>;
    }
    case "certifications": if (!site.certifications.length) return null; return <section id="certifications" className="space-y-5"><Heading section={section}/><Grid section={section}>{site.certifications.map((c) => <article key={c.id} className="portfolio-cert-card portfolio-card rounded-xl border bg-card p-4 space-y-2" data-compact={section.layout === "compact"}><DemoBadge demo={c.demo}/>{c.imageUrl && <img src={c.imageUrl} alt={c.title} className="cert-image max-h-48 w-full aspect-[4/3] object-contain rounded-lg bg-muted/40"/>}<h3 className="font-semibold text-sm wrap-break-word">{translated(c,"title",language)}</h3><p className="text-xs text-muted-foreground wrap-break-word">{translated(c,"issuer",language)}{c.issued ? ` · ${c.issued}` : ""}</p>{c.credentialId && <p className="text-xs text-muted-foreground break-all">ID: {c.credentialId}</p>}<div className="flex flex-wrap gap-3 text-xs">{c.credentialUrl && <External url={c.credentialUrl}>{en ? "Verify" : "Verifikasi"}</External>}{c.documentUrl && <External url={c.documentUrl}>{en ? "Document" : "Dokumen"}</External>}</div></article>)}</Grid></section>;
    case "activities": if (!site.activities.length) return null; return <section id="activities" className="space-y-5"><Heading section={section}/><Grid section={section}>{site.activities.map((a) => <article key={a.id} className={`portfolio-card flex gap-3 ${section.layout !== "list" ? "rounded-2xl border bg-card p-4" : ""}`}><ListLogo src={a.image} alt={a.title}/><div className="min-w-0"><DemoBadge demo={a.demo}/><h3 className="text-sm font-semibold"><External url={a.href}>{translated(a,"title",language)}</External></h3><p className="text-xs text-muted-foreground">{translated(a,"dates",language)} · {translated(a,"location",language)}</p><p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{translated(a,"description",language)}</p></div></article>)}</Grid></section>;
    case "blog": { const posts = site.posts.filter(p => p.status === "published"); if (!posts.length) return null; return <section id="blog" className="space-y-4"><Heading section={section}/><Grid section={section}>{posts.map(p => <article key={p.id} className={`portfolio-card ${section.layout !== "list" ? "rounded-2xl border bg-card p-4" : "border-b pb-3"}`}><DemoBadge demo={p.demo}/><Link href={`/blog/${p.slug}`} className="text-sm font-semibold hover:underline">{translated(p,"title",language)} <ArrowUpRight className="inline size-3"/></Link><p className="text-xs text-muted-foreground mt-1">{p.date} · {translated(p,"description",language)}</p></article>)}</Grid><Link href="/blog" className="text-sm underline">{en ? "All posts" : "Semua tulisan"}</Link></section>; }
    case "contact": return <section id="contact" className={`rounded-2xl border p-6 sm:p-8 space-y-4 bg-card ${section.layout !== "list" ? "text-center" : ""}`}><Heading section={section}/><h3 className="text-2xl font-bold">{translated(site.settings,"contactHeading",language)}</h3><p className="text-sm text-muted-foreground">{translated(site.settings,"contactText",language)}</p>{site.profile.email && <a href={`mailto:${site.profile.email}`} className="inline-flex rounded-xl bg-primary text-primary-foreground py-2 px-4 text-sm items-center gap-2"><Mail className="size-4"/>{en ? "Email me" : "Email saya"}</a>}</section>;
    default: return null;
  }
}
export default function Page() {
  const { language } = useLocale();
  const demoContent = site.profile.name === "Nama Kamu" || [site.work, site.education, site.projects, site.certifications, site.activities, site.posts].some(items => items.some(item => item.demo));
  return <main className="min-h-dvh flex flex-col gap-14 sm:gap-20 relative">
    {demoContent && <div role="note" className="demo-banner">{language === "id" ? "Mode contoh: sebagian data di halaman ini hanya untuk pratinjau desain, bukan riwayat atau sertifikat asli. Ganti/hapus melalui admin sebelum dipublikasikan." : "Sample content: some entries are placeholders to preview the layout, not real experience or credentials. Replace/remove them in Admin before publishing."}</div>}
    {site.sections.filter(s => s.visible).map((s, idx) => <BlurFade key={s.id} delay={fade * (idx + 1)}><DisplaySection section={s}/></BlurFade>)}
    <footer className="text-center text-xs text-muted-foreground pb-4">© {new Date().getFullYear()} {site.profile.name} · {language === "id" ? "Dibangun dengan Next.js & Magic UI" : "Built with Next.js & Magic UI"}</footer>
  </main>;
}
