/* eslint-disable @next/next/no-img-element */
"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ArrowUpRight, Layers3 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import Markdown from "react-markdown";

function ProjectImage({ src, alt }: { src: string; alt: string }) {
  const [imageError, setImageError] = useState(false);

  if (!src || imageError) {
    return <div className="relative flex h-full min-h-32 w-full items-center justify-center overflow-hidden bg-linear-to-br from-muted via-secondary to-muted/70"><div className="absolute -right-8 -top-10 size-44 rounded-full border border-foreground/5"/><div className="absolute -bottom-20 -left-10 size-52 rounded-full border border-foreground/5"/><Layers3 className="size-12 text-muted-foreground/35" strokeWidth={1.2} aria-hidden="true" /></div>;
  }

  return (
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-cover"
      onError={() => setImageError(true)}
    />
  );
}

interface Props {
  title: string;
  compact?: boolean;
  href?: string;
  description: string;
  dates: string;
  tags: readonly string[];
  link?: string;
  image?: string;
  video?: string;
  links?: readonly {
    icon: React.ReactNode;
    type: string;
    href: string;
  }[];
  className?: string;
}

export function ProjectCard({
  title,
  compact = false,
  href,
  description,
  dates,
  tags,
  link,
  image,
  video,
  links,
  className,
}: Props) {
  return (
    <div
      data-compact={compact}
      className={cn(
        "portfolio-project-card flex flex-col h-full border border-border rounded-xl overflow-hidden",
        className
      )}
    >
      <div className="project-media relative shrink-0">
        <div className="block">
          {video ? (
            <video
              src={video}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          ) : image ? (
            <ProjectImage src={image} alt={title} />
          ) : (
            <div className="relative flex h-full min-h-32 w-full items-center justify-center overflow-hidden bg-linear-to-br from-muted via-secondary to-muted/70"><div className="absolute -right-8 -top-10 size-44 rounded-full border border-foreground/5"/><Layers3 className="size-12 text-muted-foreground/35" strokeWidth={1.2} aria-hidden="true" /></div>
          )}
        </div>
        {links && links.length > 0 && (
          <div className="absolute top-2 right-2 flex flex-wrap gap-2">
            {links.map((link, idx) => (
              <Link
                href={link.href}
                key={idx}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                <Badge
                  className="flex items-center gap-1.5 text-xs bg-black text-white hover:bg-black/90"
                  variant="default"
                >
                  {link.icon}
                  {link.type}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </div>
      <div className="project-body p-4 sm:p-5 flex flex-col gap-3 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <h3 className="font-semibold text-sm sm:text-base leading-snug wrap-break-word">{title}</h3>
            <time className="text-xs text-muted-foreground">{dates}</time>
          </div>
          {href && <Link
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
            aria-label={`Open ${title}`}
          >
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          </Link>}
        </div>
        <div className="project-description text-xs flex-1 prose max-w-full text-pretty font-sans leading-relaxed text-muted-foreground dark:prose-invert">
          <Markdown>{description}</Markdown>
        </div>
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-auto">
            {tags.map((tag) => (
              <Badge
                key={tag}
                className="text-[11px] font-medium border border-border h-6 w-fit px-2"
                variant="outline"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
