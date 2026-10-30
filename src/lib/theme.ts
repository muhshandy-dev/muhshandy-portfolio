import type { SiteData } from "@/lib/site-schema";

/** Variabel CSS yang diturunkan dari pengaturan tema admin. */
export function themeStyle(settings: SiteData["settings"]) {
  const rgb = settings.accentColor.slice(1);
  const luminance = [0, 2, 4].map((i) => parseInt(rgb.slice(i, i + 2), 16)).reduce((sum, v, i) => sum + v * [0.299, 0.587, 0.114][i], 0);
  const radius = { sharp: "0.375rem", normal: "0.625rem", round: "1rem" }[settings.radius] ?? "0.625rem";
  return {
    "--primary": settings.accentColor,
    "--primary-foreground": luminance > 160 ? "#101827" : "#ffffff",
    "--ring": settings.accentColor,
    "--radius": radius,
  } as Record<string, string>;
}

export const shellWidthClass = (w: SiteData["settings"]["contentWidth"]) =>
  ({ medium: "max-w-5xl", wide: "max-w-7xl", full: "max-w-[1600px]" } as const)[w] ?? "max-w-7xl";
