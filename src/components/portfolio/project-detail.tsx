/* eslint-disable @next/next/no-img-element */
"use client";
import Link from "next/link";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, FileText, Github, Globe } from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import { useSite } from "@/components/site-provider";
import { DemoBadge } from "@/components/portfolio/sections";
import { Badge } from "@/components/ui/badge";
import { translated } from "@/lib/i18n";

export default function ProjectDetail({ id }: { id: string }) {
  const { language, t } = useLocale();
  const { data } = useSite();
  const p = data.projects.find((x) => x.id === id);
  if (!p) return null;
  const details = translated(p, "details", language);
  const limitations = translated(p, "limitations", language);
  return <article className="mx-auto max-w-3xl space-y-8">
    <Link href="/#projects" className="ui-button"><ArrowLeft className="size-4" aria-hidden />{t("backToProjects")}</Link>
    <header className="space-y-4">
      <div className="flex flex-wrap gap-1.5"><span className="status-label" data-status={p.status}>{t(`status.${p.status}`)}</span><DemoBadge demo={p.demo} /></div>
      <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">{translated(p, "title", language)}</h1>
      <div className="prose max-w-none text-muted-foreground dark:prose-invert"><Markdown remarkPlugins={[remarkGfm]}>{translated(p, "description", language)}</Markdown></div>
      <dl className="grid gap-3 text-sm sm:grid-cols-3">
        {p.dates && <div><dt className="text-xs text-muted-foreground">{t("period")}</dt><dd className="font-medium">{translated(p, "dates", language)}</dd></div>}
        {p.role && <div><dt className="text-xs text-muted-foreground">{t("role")}</dt><dd className="font-medium">{translated(p, "role", language)}</dd></div>}
        <div><dt className="text-xs text-muted-foreground">{t("status")}</dt><dd className="font-medium">{t(`status.${p.status}`)}</dd></div>
      </dl>
      <div className="flex flex-wrap gap-2">
        {p.href && <a className="ui-button ui-button-primary" href={p.href} target="_blank" rel="noopener noreferrer"><Globe className="size-4" aria-hidden />{t("demo")}</a>}
        {p.repoUrl && <a className="ui-button" href={p.repoUrl} target="_blank" rel="noopener noreferrer"><Github className="size-4" aria-hidden />{t("code")}</a>}
        {p.evaluationUrl && <a className="ui-button" href={p.evaluationUrl} target="_blank" rel="noopener noreferrer"><FileText className="size-4" aria-hidden />{t("results")}</a>}
      </div>
    </header>
    {p.video ? <video src={p.video} controls muted playsInline preload="metadata" className="w-full rounded-xl border" /> : p.image ? <img src={p.image} alt="" width={800} height={450} className="w-full rounded-xl border object-cover" /> : null}
    {details && <section className="prose max-w-none dark:prose-invert"><Markdown remarkPlugins={[remarkGfm]}>{details}</Markdown></section>}
    {p.technologies.length > 0 && <section className="space-y-2"><h2 className="text-lg font-semibold">{t("technologies")}</h2><ul className="flex flex-wrap gap-1.5">{p.technologies.map((tag) => <li key={tag}><Badge variant="outline">{tag}</Badge></li>)}</ul></section>}
    {limitations && <section className="surface-card space-y-2 p-5"><h2 className="text-lg font-semibold">{t("limitations")}</h2><p className="text-sm whitespace-pre-wrap text-muted-foreground">{limitations}</p></section>}
  </article>;
}
