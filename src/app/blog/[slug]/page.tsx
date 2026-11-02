import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Article from "@/components/blog/article";
import { publishedPosts, site } from "@/lib/site";

export const dynamicParams = false;
export function generateStaticParams() { return publishedPosts(site).map((p) => ({ slug: p.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = publishedPosts(site).find((p) => p.slug === slug);
  return { title: post?.title ?? "Tulisan", description: post?.description ?? "", alternates: { canonical: `/blog/${slug}` } };
}
export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!publishedPosts(site).some((p) => p.slug === slug)) notFound();
  return <Article slug={slug} />;
}
