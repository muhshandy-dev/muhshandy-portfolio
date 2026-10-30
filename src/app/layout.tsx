import Navbar from "@/components/navbar";
import { ThemeProvider } from "@/components/theme-provider";
import { LocaleProvider } from "@/components/locale-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { site } from "@/lib/site";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { FlickeringGrid } from "@/components/magicui/flickering-grid";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans", weight: ["400","500","600","700"] });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400", "500", "600"] });
const url = site.profile.siteUrl.startsWith("http") ? site.profile.siteUrl : "http://localhost:3000";
export const metadata: Metadata = {
  metadataBase: new URL(url),
  title: { default: site.profile.name, template: `%s | ${site.profile.name}` },
  description: site.profile.description,
  openGraph: { title: site.profile.name, description: site.profile.description, url, siteName: site.profile.name, type: "website" },
  twitter: { card: "summary_large_image", title: site.profile.name, description: site.profile.description },
  robots: { index: true, follow: true },
  icons: { icon: site.settings.faviconUrl || "/brand-default.svg", shortcut: site.settings.faviconUrl || "/brand-default.svg" },
};
const rgb = site.settings.accentColor.slice(1);
const shellWidth = ({ medium: "max-w-5xl", wide: "max-w-7xl", full: "max-w-[1600px]" } as const)[site.settings.contentWidth] || "max-w-7xl";
const lightness = [0,2,4].map(i => parseInt(rgb.slice(i,i+2),16)).reduce((sum,v,i) => sum + v * [0.299,0.587,0.114][i],0);
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id" suppressHydrationWarning><body className={`${geist.variable} ${mono.variable} min-h-screen bg-background font-sans antialiased relative`} style={{ "--primary": site.settings.accentColor, "--primary-foreground": lightness > 160 ? "#101827" : "#ffffff" } as React.CSSProperties}><ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}><LocaleProvider><TooltipProvider delayDuration={0}><div className="absolute inset-x-0 top-0 h-[100px] overflow-hidden z-0"><FlickeringGrid className="h-full w-full" squareSize={2} gridGap={2} style={{ maskImage: "linear-gradient(to bottom,black,transparent)", WebkitMaskImage: "linear-gradient(to bottom,black,transparent)" }}/></div><div className={`portfolio-shell relative z-10 w-full ${shellWidth} mx-auto pt-24 pb-28 sm:pt-28 px-5 sm:px-8` }>{children}</div><Navbar/></TooltipProvider></LocaleProvider></ThemeProvider></body></html>;
}
