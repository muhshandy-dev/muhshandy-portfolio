"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSite } from "@/components/site-provider";
import { useLocale } from "@/components/locale-provider";
import { useActiveSection, useGoToSection, useNavSections } from "@/components/section-nav";
import { shellWidthClass } from "@/lib/theme";
import { LANGUAGES } from "@/lib/i18n";

function LanguageToggle() {
  const { language, setLanguage, t } = useLocale();
  return <div className="lang-toggle" role="group" aria-label={t("selectLanguage")}>
    {LANGUAGES.map((lang) => <button key={lang} type="button" onClick={() => setLanguage(lang)} aria-pressed={language === lang} lang={lang} aria-label={lang === "id" ? t("langId") : t("langEn")}>{lang.toUpperCase()}</button>)}
  </div>;
}

export default function SiteHeader() {
  const { data } = useSite();
  const { t } = useLocale();
  const pathname = usePathname();
  const sections = useNavSections();
  const active = useActiveSection(pathname === "/" ? sections.map((s) => s.id) : []);
  const go = useGoToSection();
  const initials = data.profile.name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const left = data.settings.languagePosition === "top-left";
  if (pathname.startsWith("/admin")) return null;
  return <header className="site-header">
    <a href="#main" className="skip-link">{t("skipToContent")}</a>
    <div className={`mx-auto flex h-14 w-full items-center gap-3 px-4 sm:px-8 ${shellWidthClass(data.settings.contentWidth)}`}>
      {left && <LanguageToggle />}
      <Link href="/" onClick={(e) => go("hero", e)} className="brand-link" aria-label={`${data.profile.name} — ${t("home")}`}>
        <span className="brand-mark" aria-hidden>{initials}</span>
        <span className="hidden truncate sm:inline">{data.profile.name}</span>
      </Link>
      <nav aria-label={t("sectionNav")} className="header-nav">
        <ul>
          {sections.map((s) => <li key={s.id}><a href={`/#${s.id}`} onClick={(e) => go(s.id, e)} aria-current={pathname === "/" && active === s.id ? "location" : undefined}>{s.label}</a></li>)}
        </ul>
      </nav>
      <div className="ml-auto flex items-center gap-2">{!left && <LanguageToggle />}</div>
    </div>
  </header>;
}
