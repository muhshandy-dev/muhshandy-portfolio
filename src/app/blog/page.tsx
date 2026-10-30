"use client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useSite } from "@/components/site-provider";
import { useLocale } from "@/components/locale-provider";
import { DemoBadge } from "@/components/portfolio/sections";
import { translated } from "@/lib/i18n";
import { publishedPosts } from "@/lib/site-utils";

export default function BlogPage() {
  const { data } = useSite();
  const { language, t } = useLocale();
  const posts = [...publishedPosts(data)].sort((a, b) => b.date.localeCompare(a.date));
  return <div className="mx-auto max-w-3xl space-y-8">
    <Link href="/" className="ui-button"><ArrowLeft className="size-4" aria-hidden />{t("home")}</Link>
    <div><h1 className="text-2xl font-bold">{t("writing")}</h1><p className="text-sm text-muted-foreground">{t("postsCount", { n: posts.length })}</p></div>
    {posts.length ? <ul className="space-y-2">{posts.map((p) => <li key={p.id}><article className="surface-card relative p-5"><DemoBadge demo={p.demo} /><h2 className="font-semibold"><Link href={`/blog/${p.slug}`} className="card-link">{translated(p, "title", language)}</Link></h2><p className="my-1 text-xs text-muted-foreground"><time dateTime={p.date}>{p.date}</time></p><p className="text-sm text-muted-foreground">{translated(p, "description", language)}</p></article></li>)}</ul>
      : <p className="text-sm text-muted-foreground">{t("noPosts")}</p>}
  </div>;
}
