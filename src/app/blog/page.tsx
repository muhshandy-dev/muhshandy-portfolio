"use client";
import { site } from "@/lib/site";
import { translated, useLocale } from "@/components/locale-provider";
import Link from "next/link";
export default function BlogPage() {
  const { language } = useLocale();
  const en = language === "en";
  const posts = site.posts.filter(p => p.status === "published").sort((a,b) => b.date.localeCompare(a.date));
  return <main className="space-y-8"><div><h1 className="text-2xl font-bold">{en ? "Writing" : "Blog"}</h1><p className="text-sm text-muted-foreground">{posts.length} {en ? "posts" : "tulisan"}</p></div>{posts.length ? posts.map(p => <Link href={`/blog/${p.slug}`} key={p.id} className="block border-b pb-5 hover:underline"><h2 className="font-semibold">{translated(p, "title", language)}</h2><p className="text-xs text-muted-foreground my-1">{p.date}</p><p className="text-sm text-muted-foreground">{translated(p, "description", language)}</p></Link>) : <p className="text-muted-foreground text-sm">{en ? "No published posts yet." : "Belum ada tulisan yang dipublikasikan."}</p>}<Link href="/" className="text-sm underline">← {en ? "Home" : "Beranda"}</Link></main>;
}
