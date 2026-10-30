"use client";

import type { ReactNode } from "react";
import BlurFade from "@/components/magicui/blur-fade";
import { useSite } from "@/components/site-provider";
import { useReducedMotionPref } from "@/components/smart-collection";

/** BlurFade Magic UI yang mengikuti pengaturan animasi admin dan prefers-reduced-motion. */
export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const { data } = useSite();
  const reduced = useReducedMotionPref();
  const mode = data.settings.animation;
  if (mode === "off" || reduced) return <div className={className}>{children}</div>;
  return <BlurFade delay={delay} inView className={className} blur={mode === "subtle" ? "0px" : "6px"} yOffset={mode === "subtle" ? 4 : 6} duration={mode === "subtle" ? 0.3 : 0.4}>{children}</BlurFade>;
}
