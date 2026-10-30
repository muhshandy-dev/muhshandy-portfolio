"use client";
import Link from "next/link";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft } from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import { useSite } from "@/components/site-provider";
import { DemoBadge } from "@/components/portfolio/sections";
import { translated } from "@/lib/i18n";

export default function Article({ slug }: { slug: string }) {
  const { language, t } = useLocale();
  const { data } = useSite();
  const post = data.posts.find((p) => p.slug === slug);
  if (!post) return null;
  return <article className="mx-auto max-w-3xl space-y-6">
    <Link href="/blog" className="ui-button"><ArrowLeft className="size-4" aria-hidden />{t("allPosts")}</Link>
    <header className="space-y-3"><DemoBadge demo={post.demo} /><time dateTime={post.date} className="block text-xs text-muted-foreground">{post.date}</time><h1 className="text-3xl font-bold tracking-tight text-balance">{translated(post, "title", language)}</h1><p className="text-muted-foreground">{translated(post, "description", language)}</p></header>
    <div className="prose max-w-none dark:prose-invert"><Markdown remarkPlugins={[remarkGfm]}>{translated(post, "content", language)}</Markdown></div>
  </article>;
}
