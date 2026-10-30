"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUp, Check, Compass, Globe, Home, Notebook, X } from "lucide-react";
import { Dock, DockIcon } from "@/components/magicui/dock";
import { ModeToggle } from "@/components/mode-toggle";
import { useLocale } from "@/components/locale-provider";
import { useSite } from "@/components/site-provider";
import { socialIcons } from "@/components/social-icons";
import { useActiveSection, useGoToSection, useNavSections } from "@/components/section-nav";
import { shown } from "@/lib/site-utils";

/** Dock bawah ala Magic UI: beranda, menu section, blog, sosial, dan tema. Bahasa ada di header atas. */
export default function Navbar() {
  const { data } = useSite();
  const { t } = useLocale();
  const pathname = usePathname();
  const sections = useNavSections();
  const active = useActiveSection(pathname === "/" ? sections.map((s) => s.id) : []);
  const go = useGoToSection();
  const [open, setOpen] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 640);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector<HTMLElement>("a[aria-current], a")?.focus();
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node) && !triggerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const close = (refocus = true) => { setOpen(false); if (refocus) triggerRef.current?.focus(); };
  const onMenuKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const links = Array.from(menuRef.current?.querySelectorAll<HTMLElement>("a,button") ?? []);
    const i = links.indexOf(document.activeElement as HTMLElement);
    if (e.key === "Escape") { e.preventDefault(); close(); }
    else if (e.key === "ArrowDown") { e.preventDefault(); links[(i + 1) % links.length]?.focus(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); links[(i - 1 + links.length) % links.length]?.focus(); }
    else if (e.key === "Home") { e.preventDefault(); links[0]?.focus(); }
    else if (e.key === "End") { e.preventDefault(); links.at(-1)?.focus(); }
  };

  if (pathname.startsWith("/admin")) return null;
  const blogVisible = data.sections.find((s) => s.id === "blog")?.visible;
  const socials = shown(data, "socialLinks").filter((s) => s.dock && s.href);
  const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.animation === "off";

  return <>
    {open && <div ref={menuRef} id="portfolio-quick-menu" className="quick-menu" role="dialog" aria-label={t("jumpTo")} onKeyDown={onMenuKey}>
      <div className="flex items-center justify-between px-3 pb-2">
        <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">{t("jumpTo")}</p>
        <button type="button" className="ui-icon-button size-8! min-w-8!" onClick={() => close()} aria-label={t("closeMenu")}><X className="size-4" aria-hidden /></button>
      </div>
      <nav aria-label={t("sectionNav")}>
        <Link href="/#hero" onClick={(e) => { go("hero", e); close(false); }} aria-current={pathname === "/" && active === "hero" ? "location" : undefined}><span>{t("home")}</span>{active === "hero" && pathname === "/" && <Check className="size-4" aria-hidden />}</Link>
        {sections.map((s) => <a key={s.id} href={`/#${s.id}`} onClick={(e) => { go(s.id, e); close(false); }} aria-current={pathname === "/" && active === s.id ? "location" : undefined}><span>{s.label}</span>{pathname === "/" && active === s.id && <Check className="size-4" aria-hidden />}</a>)}
      </nav>
    </div>}

    {showTop && <button type="button" className="back-to-top" onClick={() => { window.scrollTo({ top: 0, behavior: reduced() ? "auto" : "smooth" }); if (pathname === "/") window.history.replaceState(null, "", window.location.pathname); }} aria-label={t("backToTop")} title={t("backToTop")}><ArrowUp className="size-5" aria-hidden /></button>}

    <nav aria-label={t("mainNav")} className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-3">
      <Dock className="dock-bar pointer-events-auto" magnification={52} distance={110}>
        <DockIcon><Link href="/" onClick={(e) => go("hero", e)} aria-label={t("home")} title={t("home")} className="dock-link"><Home className="size-full" aria-hidden /></Link></DockIcon>
        <DockIcon><button ref={triggerRef} type="button" className="dock-link" aria-expanded={open} aria-controls="portfolio-quick-menu" aria-haspopup="dialog" aria-label={t("explore")} title={t("explore")} onClick={() => setOpen((v) => !v)}><Compass className="size-full" aria-hidden /></button></DockIcon>
        {blogVisible && <DockIcon><Link href="/blog" aria-label={t("blog")} title={t("blog")} className="dock-link" aria-current={pathname.startsWith("/blog") ? "page" : undefined}><Notebook className="size-full" aria-hidden /></Link></DockIcon>}
        {socials.length > 0 && <span className="dock-sep" aria-hidden />}
        {socials.map((s) => { const Icon = socialIcons[s.icon] ?? Globe; return <DockIcon key={s.id}><a href={s.href} aria-label={s.label} title={s.label} className="dock-link" target={/^https?:\/\//.test(s.href) ? "_blank" : undefined} rel="noopener noreferrer"><Icon className="size-full" aria-hidden /></a></DockIcon>; })}
        <span className="dock-sep" aria-hidden />
        <DockIcon><ModeToggle className="dock-link" /></DockIcon>
      </Dock>
    </nav>
  </>;
}
