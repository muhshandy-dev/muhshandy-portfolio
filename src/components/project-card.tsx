/* eslint-disable @next/next/no-img-element */
"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ArrowUpRight, Layers3 } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import Markdown from "react-markdown";

function Placeholder() {
  return <div className="relative flex h-full min-h-32 w-full items-center justify-center overflow-hidden bg-linear-to-br from-muted via-secondary to-muted/70"><div className="absolute -right-8 -top-10 size-44 rounded-full border border-foreground/5" /><div className="absolute -bottom-20 -left-10 size-52 rounded-full border border-foreground/5" /><Layers3 className="size-12 text-muted-foreground/35" strokeWidth={1.2} aria-hidden="true" /></div>;
}

function ProjectImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <Placeholder />;
  return <img src={src} alt={alt} loading="lazy" decoding="async" width={800} height={450} className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]" onError={() => setFailed(true)} />;
}

interface Props {
  title: string;
  description: string;
  dates: string;
  tags: readonly string[];
  compact?: boolean;
  /** Halaman detail proyek di situs ini. */
  detailHref?: string;
  detailLabel?: string;
  image?: string;
  video?: string;
  badges?: ReactNode;
  links?: readonly { icon: ReactNode; type: string; href: string }[];
  className?: string;
}

export function ProjectCard({ title, description, dates, tags, compact = false, detailHref, detailLabel = "Detail", image, video, badges, links, className }: Props) {
  return (
    <article data-compact={compact} className={cn("portfolio-project-card group relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card", className)}>
      <div className="project-media relative shrink-0 overflow-hidden bg-muted">
        {video ? <video src={video} autoPlay loop muted playsInline preload="metadata" className="h-full w-full object-cover" /> : <ProjectImage src={image ?? ""} alt="" />}
      </div>
      <div className="project-body flex flex-1 flex-col gap-3 p-4 sm:p-5">
        {badges && <div className="flex flex-wrap items-center gap-1.5">{badges}</div>}
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-semibold leading-snug wrap-break-word sm:text-base">
            {detailHref ? <Link href={detailHref} className="card-link">{title}</Link> : title}
          </h3>
          {dates && <p className="text-xs text-muted-foreground">{dates}</p>}
        </div>
        <div className="project-description prose prose-sm dark:prose-invert max-w-none flex-1 text-xs leading-relaxed text-pretty text-muted-foreground"><Markdown allowedElements={["p", "strong", "em", "code", "br"]} unwrapDisallowed>{description}</Markdown></div>
        {tags.length > 0 && <ul className="flex flex-wrap gap-1" aria-label="Tech">{tags.map((tag) => <li key={tag}><Badge className="h-6 w-fit border border-border px-2 text-[11px] font-medium" variant="outline">{tag}</Badge></li>)}</ul>}
        {(links?.length || detailHref) ? <div className="relative z-10 flex flex-wrap gap-2 pt-1">
          {detailHref && <Link href={detailHref} className="ui-chip ui-chip-primary">{detailLabel}<ArrowUpRight className="size-3" aria-hidden /></Link>}
          {links?.map((link) => <a key={link.href + link.type} href={link.href} target="_blank" rel="noopener noreferrer" className="ui-chip">{link.icon}{link.type}</a>)}
        </div> : null}
      </div>
    </article>
  );
}
