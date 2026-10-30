import { site } from "@/lib/site";
import { notFound } from "next/navigation";
import Article from "@/components/blog/article";
import type { Metadata } from "next";
export const dynamicParams = false;
export function generateStaticParams() { return site.posts.filter(p=>p.status === "published").map(p=>({ slug: p.slug })); }
export async function generateMetadata({ params }: { params: Promise<{slug: string}> }): Promise<Metadata> {
 const {slug} = await params; const post = site.posts.find(p=>p.slug===slug && p.status==="published");
 return { title: post?.title ?? "Tulisan", description: post?.description ?? "" };
}
export default async function PostPage({ params }: { params: Promise<{slug: string}> }) {
 const {slug} = await params; const post = site.posts.find(p=>p.slug===slug && p.status==="published");
 if (!post) notFound();
 return <Article post={post}/>;
}
