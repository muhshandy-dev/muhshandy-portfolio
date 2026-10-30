"use client";
import { useEffect, useState } from "react";
import { ModeToggle } from "@/components/mode-toggle";
import { useLocale } from "@/components/locale-provider";
import { site } from "@/lib/site";
import { Home, Notebook, Compass, ChevronRight, Github, Linkedin, Twitter, Instagram, Youtube, Globe, Mail, ExternalLink, type LucideIcon } from "lucide-react";

const icons: Record<string, LucideIcon> = { github: Github, linkedin: Linkedin, twitter: Twitter, instagram: Instagram, youtube: Youtube, globe: Globe, mail: Mail, external: ExternalLink };
export default function Navbar() {
  const { language, setLanguage } = useLocale();
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => { if (!menuOpen) return; const close = (event: KeyboardEvent) => { if (event.key === "Escape") setMenuOpen(false); }; document.addEventListener("keydown", close); return () => document.removeEventListener("keydown", close); }, [menuOpen]);
  const entries = [
    { href: "/", label: language === "id" ? "Beranda" : "Home", icon: Home },
    ...(site.sections.find(s => s.id === "blog")?.visible ? [{ href: "/blog", label: "Blog", icon: Notebook }] : []),
    ...site.socialLinks.filter(s => s.dock && s.href).map(s => ({ href: s.href, label: s.label, icon: icons[s.icon] || Globe })),
  ];
  const left = site.settings.languagePosition === "top-left";
  return <>
    <div className={`pointer-events-none fixed z-50 top-4 ${left ? "left-4" : "right-4"}`}>
      <div className="pointer-events-auto inline-flex gap-1.5 p-1.5 rounded-full border bg-card/95 shadow-lg backdrop-blur-xl" role="group" aria-label={language === "id" ? "Pilih bahasa" : "Select language"}>
        {(["id", "en"] as const).map(lang => <button key={lang} className="nav-control text-xs font-bold" type="button" onClick={() => setLanguage(lang)} aria-label={lang === "id" ? "Bahasa Indonesia" : "English"} aria-pressed={language === lang}>{lang.toUpperCase()}</button>)}
      </div>
    </div>
    {menuOpen && <nav id="portfolio-quick-menu" aria-label={language === "id" ? "Navigasi bagian halaman" : "Page sections"} className="quick-menu">
      <p className="px-3 pb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">{language === "id" ? "Langsung ke bagian" : "Jump to section"}</p>
      {site.sections.filter(s => s.visible && (s.id === "hero" || s.id === "about" || s.id === "contact" || ({ projects: site.projects, work: site.work, education: site.education, skills: site.skills, certifications: site.certifications, activities: site.activities, blog: site.posts.filter(p => p.status === "published") }[s.id as "projects"]?.length ?? 0) > 0)).map(s => <a key={s.id} href={`/#${s.id}`} onClick={(event) => { setMenuOpen(false); if (window.location.pathname === "/") { const node = document.getElementById(s.id); if (node) { event.preventDefault(); node.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" }); window.history.replaceState(null, "", `/#${s.id}`); } } }}><span>{language === "en" && s.en?.title ? s.en.title : s.title || s.id}</span><ChevronRight className="size-4 text-muted-foreground" /></a>)}
    </nav>}
    <nav aria-label={language === "id" ? "Navigasi utama" : "Main navigation"} className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-3">
      <div className="pointer-events-auto flex w-fit max-w-full items-center gap-1.5 overflow-x-auto rounded-full border bg-card/95 p-2 shadow-xl backdrop-blur-2xl">
        {entries.map(({ href, label, icon: Icon }, i) => <a key={`${href}-${i}`} href={href} aria-label={label} title={label} className="nav-control" target={/^https?:\/\//.test(href) ? "_blank" : undefined} rel={/^https?:\/\//.test(href) ? "noopener noreferrer" : undefined}><Icon className="size-5" aria-hidden="true"/></a>)}
        <button type="button" className="nav-control" aria-expanded={menuOpen} aria-controls="portfolio-quick-menu" aria-label={language === "id" ? "Jelajahi bagian halaman" : "Jump to a section"} title={language === "id" ? "Jelajahi" : "Explore"} onClick={() => setMenuOpen(v => !v)}><Compass className="size-5"/></button>
        <span className="mx-1 h-6 w-px shrink-0 bg-border" aria-hidden="true" />
        <ModeToggle className="nav-control" />
      </div>
    </nav>
  </>;
}
