/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowUpRight, FileText, Github, Globe, Mail, MapPin, Phone } from "lucide-react";
import BlurFadeText from "@/components/magicui/blur-fade-text";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProjectCard } from "@/components/project-card";
import { SmartCollection } from "@/components/smart-collection";
import { Reveal } from "@/components/reveal";
import { useLocale } from "@/components/locale-provider";
import { useSite } from "@/components/site-provider";
import { socialIcons } from "@/components/social-icons";
import { translated, type Language } from "@/lib/i18n";
import { publishedPosts, sectionHasContent, shown } from "@/lib/site-utils";
import type { Section, SiteData } from "@/lib/site-schema";
import type { ReactNode } from "react";

export function DemoBadge({ demo }: { demo?: boolean }) {
  const { t } = useLocale();
  return demo ? <span className="demo-label">{t("demoLabel")}</span> : null;
}

function StatusBadge({ status }: { status: SiteData["projects"][number]["status"] }) {
  const { t } = useLocale();
  return <span className="status-label" data-status={status}>{t(`status.${status}`)}</span>;
}

function Heading({ section, id }: { section: Section; id: string }) {
  const { language } = useLocale();
  const subtitle = translated(section, "subtitle", language);
  return <div className="section-heading space-y-1">
    <h2 id={`${id}-title`} tabIndex={-1} className="text-xl font-bold tracking-tight sm:text-2xl">{translated(section, "title", language)}</h2>
    {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
  </div>;
}

function Logo({ src, alt }: { src: string; alt: string }) {
  return src
    ? <img src={src} alt={alt} loading="lazy" decoding="async" width={40} height={40} className="size-10 flex-none rounded-xl border bg-background object-contain p-1" />
    : <div aria-hidden="true" className="size-10 flex-none rounded-xl border bg-muted" />;
}

function External({ url, children }: { url: string; children: ReactNode }) {
  return url ? <a href={url} target="_blank" rel="noopener noreferrer" className="link-underline inline-flex items-center gap-1">{children}<ArrowUpRight className="size-3 shrink-0" aria-hidden /></a> : <>{children}</>;
}

function Shell({ section, children, className = "" }: { section: Section; children: ReactNode; className?: string }) {
  return <section id={section.id} aria-labelledby={`${section.id}-title`} className={`portfolio-section space-y-5 ${className}`}>{children}</section>;
}

const cardClass = (section: Section) => (section.layout === "list" ? "portfolio-card flex items-start gap-3 border-b pb-4" : "portfolio-card surface-card flex items-start gap-3 p-4");

function Hero({ section, data, language }: { section: Section; data: SiteData; language: Language }) {
  const { t } = useLocale();
  const p = data.profile;
  const centered = section.layout === "compact";
  return <section id="hero" aria-labelledby="hero-title" className={`portfolio-section space-y-6 ${centered ? "mx-auto max-w-3xl text-center" : ""}`}>
    <div className={`flex gap-6 ${centered ? "flex-col-reverse items-center" : "flex-col-reverse items-start justify-between sm:flex-row"}`}>
      <div className="min-w-0 max-w-3xl space-y-3">
        <h1 id="hero-title" tabIndex={-1} className="sr-only">{p.name}</h1>
        <BlurFadeText delay={0.04} className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-5xl" yOffset={8} text={`${translated(data.settings, "introGreeting", language)} ${p.name}`.trim()} />
        <p className="text-sm font-semibold sm:text-base">{translated(p, "headline", language)}</p>
        <p className="text-base text-muted-foreground sm:text-lg">{translated(p, "description", language)}</p>
        <div className={`flex flex-wrap items-center gap-3 pt-1 ${centered ? "justify-center" : ""}`}>
          {p.location && <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3" aria-hidden />{p.locationUrl ? <External url={p.locationUrl}>{translated(p, "location", language)}</External> : translated(p, "location", language)}</span>}
          {p.cvUrl && <a href={p.cvUrl} target="_blank" rel="noopener noreferrer" className="ui-button ui-button-primary"><FileText className="size-4" aria-hidden />{t("viewCv")}</a>}
          {p.email && <a href={`mailto:${p.email}`} className="ui-button"><Mail className="size-4" aria-hidden />{t("emailMe")}</a>}
        </div>
      </div>
      <Reveal delay={0.04}>
        <Avatar className="size-24 rounded-full border shadow-lg ring-4 ring-muted sm:size-32"><AvatarImage alt={p.name} src={p.avatarUrl || undefined} /><AvatarFallback className="text-lg font-semibold">{p.name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
      </Reveal>
    </div>
  </section>;
}

export function PortfolioSection({ section }: { section: Section }) {
  const { language, t } = useLocale();
  const { data } = useSite();
  if (!sectionHasContent(data, section.id)) return null;
  const label = translated(section, "title", language);
  const common = { section, label };

  switch (section.id) {
    case "hero": return <Hero section={section} data={data} language={language} />;
    case "about": return <Shell section={section}><Heading section={section} id="about" />
      <div className={`prose max-w-4xl text-sm leading-relaxed text-pretty text-muted-foreground dark:prose-invert ${section.layout !== "list" ? "surface-card p-5" : ""}`}><Markdown remarkPlugins={[remarkGfm]}>{translated(data.profile, "summary", language)}</Markdown></div>
    </Shell>;
    case "work": return <Shell section={section}><Heading section={section} id="work" /><SmartCollection {...common} minCardWidth={260} forceSingleColumn={section.layout === "list"} items={shown(data, "work").map((w) => ({ key: w.id, node:
      <article className={cardClass(section)}><Logo src={w.logoUrl} alt="" /><div className="min-w-0 flex-1 space-y-1">
        <DemoBadge demo={w.demo} />
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1"><h3 className="text-sm font-semibold"><External url={w.href}>{translated(w, "company", language)}</External></h3><span className="text-xs text-muted-foreground tabular-nums">{translated(w, "start", language)} — {translated(w, "end", language) || t("present")}</span></div>
        <p className="text-xs text-muted-foreground">{translated(w, "title", language)} · {t(`type.${w.type}`)}{w.location ? ` · ${translated(w, "location", language)}` : ""}</p>
        {w.description && <p className="pt-1 text-sm whitespace-pre-wrap text-muted-foreground">{translated(w, "description", language)}</p>}
      </div></article> }))} /></Shell>;
    case "education": return <Shell section={section}><Heading section={section} id="education" /><SmartCollection {...common} minCardWidth={260} forceSingleColumn={section.layout === "list"} items={shown(data, "education").map((e) => ({ key: e.id, node:
      <article className={cardClass(section)}><Logo src={e.logoUrl} alt="" /><div className="min-w-0 flex-1 space-y-1">
        <DemoBadge demo={e.demo} />
        <h3 className="text-sm font-semibold"><External url={e.href}>{translated(e, "school", language)}</External></h3>
        <p className="text-xs text-muted-foreground">{translated(e, "degree", language)}</p>
        <p className="text-xs text-muted-foreground tabular-nums">{e.start}{e.end ? ` — ${e.end}` : ""}</p>
        {e.description && <p className="pt-1 text-sm whitespace-pre-wrap text-muted-foreground">{translated(e, "description", language)}</p>}
      </div></article> }))} /></Shell>;
    case "skills": return <Shell section={section}><Heading section={section} id="skills" /><SmartCollection {...common} minCardWidth={120} items={shown(data, "skills").map((s) => ({ key: s.id, node:
      <div className="portfolio-card skill-chip">{translated(s, "name", language)}{s.demo && <span className="skill-demo">DEMO</span>}</div> }))} /></Shell>;
    case "projects": {
      const projects = shown(data, "projects");
      return <Shell section={section}><Heading section={section} id="projects" />
        {projects.length ? <SmartCollection {...common} minCardWidth={240} items={projects.map((p) => ({ key: p.id, node:
          <ProjectCard compact={section.layout === "compact"} title={translated(p, "title", language)} description={translated(p, "description", language)} dates={translated(p, "dates", language)} tags={p.technologies} image={p.image} video={p.video}
            detailHref={`/projects/${p.id}`} detailLabel={t("details")}
            badges={<><StatusBadge status={p.status} /><DemoBadge demo={p.demo} /></>}
            links={[
              ...(p.href ? [{ type: t("demo"), href: p.href, icon: <Globe className="size-3" aria-hidden /> }] : []),
              ...(p.repoUrl ? [{ type: t("code"), href: p.repoUrl, icon: <Github className="size-3" aria-hidden /> }] : []),
              ...(p.evaluationUrl ? [{ type: t("results"), href: p.evaluationUrl, icon: <FileText className="size-3" aria-hidden /> }] : []),
            ]} /> }))} />
          : <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">{t("noProjects")}</p>}
      </Shell>;
    }
    case "certifications": return <Shell section={section}><Heading section={section} id="certifications" /><SmartCollection {...common} minCardWidth={170} items={shown(data, "certifications").map((c) => ({ key: c.id, node:
      <article className="portfolio-card surface-card cert-card flex flex-col gap-2 p-4" data-compact={section.layout === "compact"}>
        <DemoBadge demo={c.demo} />
        {c.imageUrl && <img src={c.imageUrl} alt="" loading="lazy" decoding="async" className="cert-image aspect-[4/3] w-full rounded-lg bg-muted/40 object-contain" />}
        <h3 className="text-sm font-semibold wrap-break-word">{translated(c, "title", language)}</h3>
        <p className="text-xs text-muted-foreground wrap-break-word">{translated(c, "issuer", language)}{c.issued ? ` · ${c.issued}` : ""}</p>
        {c.credentialId && <p className="text-xs break-all text-muted-foreground">ID: {c.credentialId}</p>}
        {(c.credentialUrl || c.documentUrl) && <div className="mt-auto flex flex-wrap gap-3 pt-1 text-xs">{c.credentialUrl && <External url={c.credentialUrl}>{t("verify")}</External>}{c.documentUrl && <External url={c.documentUrl}>{t("document")}</External>}</div>}
      </article> }))} /></Shell>;
    case "activities": return <Shell section={section}><Heading section={section} id="activities" /><SmartCollection {...common} minCardWidth={240} forceSingleColumn={section.layout === "list"} items={shown(data, "activities").map((a) => ({ key: a.id, node:
      <article className={cardClass(section)}><Logo src={a.image} alt="" /><div className="min-w-0 flex-1 space-y-1">
        <DemoBadge demo={a.demo} />
        <h3 className="text-sm font-semibold"><External url={a.href}>{translated(a, "title", language)}</External></h3>
        <p className="text-xs text-muted-foreground">{[translated(a, "dates", language), translated(a, "location", language)].filter(Boolean).join(" · ")}</p>
        {a.description && <p className="pt-1 text-sm whitespace-pre-wrap text-muted-foreground">{translated(a, "description", language)}</p>}
      </div></article> }))} /></Shell>;
    case "blog": return <Shell section={section}><Heading section={section} id="blog" /><SmartCollection {...common} minCardWidth={240} forceSingleColumn={section.layout === "list"} items={publishedPosts(data).map((p) => ({ key: p.id, node:
      <article className={`${section.layout === "list" ? "portfolio-card border-b pb-3" : "portfolio-card surface-card relative p-4"} space-y-1`}>
        <DemoBadge demo={p.demo} />
        <h3 className="text-sm font-semibold"><Link href={`/blog/${p.slug}`} className="card-link">{translated(p, "title", language)} <ArrowUpRight className="inline size-3" aria-hidden /></Link></h3>
        <p className="text-xs text-muted-foreground"><time dateTime={p.date}>{p.date}</time>{p.description ? ` · ${translated(p, "description", language)}` : ""}</p>
      </article> }))} /><Link href="/blog" className="ui-button">{t("allPosts")}<ArrowUpRight className="size-4" aria-hidden /></Link></Shell>;
    case "contact": {
      const socials = shown(data, "socialLinks").filter((s) => s.href);
      return <section id="contact" aria-labelledby="contact-title" className={`portfolio-section surface-card space-y-4 p-6 sm:p-8 ${section.layout !== "list" ? "text-center" : ""}`}>
        <Heading section={section} id="contact" />
        {data.settings.contactHeading && <p className="text-2xl font-bold">{translated(data.settings, "contactHeading", language)}</p>}
        {data.settings.contactText && <p className="text-sm text-muted-foreground">{translated(data.settings, "contactText", language)}</p>}
        <div className={`flex flex-wrap gap-2 ${section.layout !== "list" ? "justify-center" : ""}`}>
          {data.profile.email && <a href={`mailto:${data.profile.email}`} className="ui-button ui-button-primary"><Mail className="size-4" aria-hidden />{t("emailMe")}</a>}
          {data.profile.phone && <a href={`tel:${data.profile.phone.replace(/[^+\d]/g, "")}`} className="ui-button"><Phone className="size-4" aria-hidden />{data.profile.phone}</a>}
          {data.profile.cvUrl && <a href={data.profile.cvUrl} target="_blank" rel="noopener noreferrer" className="ui-button"><FileText className="size-4" aria-hidden />{t("viewCv")}</a>}
          {socials.map((s) => { const Icon = socialIcons[s.icon] ?? Globe; return <a key={s.id} href={s.href} target={/^https?:/.test(s.href) ? "_blank" : undefined} rel="noopener noreferrer" className="ui-button"><Icon className="size-4" aria-hidden />{s.label}</a>; })}
        </div>
      </section>;
    }
    default: return null;
  }
}
