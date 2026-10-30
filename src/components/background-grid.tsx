"use client";

import { FlickeringGrid } from "@/components/magicui/flickering-grid";
import { usePathname } from "next/navigation";
import { useSite } from "@/components/site-provider";

export function BackgroundGrid() {
  const { data } = useSite();
  const pathname = usePathname();
  if (!data.settings.backgroundGrid || pathname.startsWith("/admin")) return null;
  return <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[120px] overflow-hidden">
    <FlickeringGrid className="h-full w-full" squareSize={2} gridGap={2} style={{ maskImage: "linear-gradient(to bottom,black,transparent)", WebkitMaskImage: "linear-gradient(to bottom,black,transparent)" }} />
  </div>;
}
