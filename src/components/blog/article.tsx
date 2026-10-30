"use client";
import { translated, useLocale } from "@/components/locale-provider";
import type { SiteData } from "@/lib/site-schema";
import Markdown from "react-markdown";
import Link from "next/link";

export default function Article({ post }: { post: SiteData["posts"][number] }) {
  const { language } = useLocale();
  return <main className="space-y-6"><Link href="/blog" className="text-sm underline">← {language === "id" ? "Semua tulisan" : "All posts"}</Link><header className="space-y-3"><time className="text-xs text-muted-foreground">{post.date}</time><h1 className="text-3xl font-bold">{translated(post, "title", language)}</h1><p className="text-muted-foreground">{translated(post, "description", language)}</p></header><article className="prose dark:prose-invert max-w-none"><Markdown>{translated(post, "content", language)}</Markdown></article></main>;
}
