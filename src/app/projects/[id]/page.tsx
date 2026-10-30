import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ProjectDetail from "@/components/portfolio/project-detail";
import { shown, site } from "@/lib/site";

export const dynamicParams = false;
export function generateStaticParams() {
  const ids = shown(site, "projects").map((p) => ({ id: p.id }));
  // output: "export" butuh minimal satu path; placeholder ini menghasilkan 404.
  return ids.length ? ids : [{ id: "_" }];
}
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const p = shown(site, "projects").find((x) => x.id === id);
  if (!p) return { title: "Proyek" };
  return { title: p.title, description: p.description.slice(0, 160), alternates: { canonical: `/projects/${id}` }, openGraph: p.image && !p.image.endsWith(".svg") ? { images: [p.image] } : undefined };
}
export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!shown(site, "projects").some((p) => p.id === id)) notFound();
  return <ProjectDetail id={id} />;
}
