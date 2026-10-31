import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import Navbar from "@/components/navbar";
import SiteHeader from "@/components/site-header";
import { ThemeProvider } from "@/components/theme-provider";
import { LocaleProvider } from "@/components/locale-provider";
import { SiteProvider } from "@/components/site-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BackgroundGrid } from "@/components/background-grid";
import { site } from "@/lib/site";
import { siteUrl } from "@/lib/seo";
import { shellWidthClass, themeStyle } from "@/lib/theme";
import "./globals.css";

// Font disajikan dari repo sendiri (Geist, lisensi OFL, lihat fonts/LICENSE-Geist-OFL.txt), bukan diunduh dari Google saat build:
// unduhan itu kadang gagal dan membuat build Cloudflare/CI gagal ("Can't resolve ...font/google/font").
const geist = localFont({ src: "./fonts/Geist-Variable.woff2", variable: "--font-sans", weight: "100 900", display: "swap" });
const mono = localFont({ src: "./fonts/GeistMono-Variable.woff2", variable: "--font-mono", weight: "100 900", display: "swap" });

const s = site.settings;
const title = s.seoTitle || site.profile.name;
const description = s.seoDescription || site.profile.description;
const favicon = s.faviconUrl || "/brand-default.svg";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: title, template: `%s | ${site.profile.name}` },
  description,
  keywords: s.seoKeywords.length ? s.seoKeywords : undefined,
  authors: [{ name: site.profile.name }],
  alternates: { canonical: "/" },
  openGraph: { title, description, url: "/", siteName: site.profile.name, type: "website", locale: "id_ID", alternateLocale: ["en_US"], ...(s.ogImageUrl ? { images: [s.ogImageUrl] } : {}) },
  twitter: { card: "summary_large_image", title, description, ...(s.ogImageUrl ? { images: [s.ogImageUrl] } : {}) },
  robots: { index: true, follow: true },
  icons: { icon: favicon, shortcut: favicon, apple: favicon },
};
export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#ffffff" }, { media: "(prefers-color-scheme: dark)", color: "#1c1c1c" }],
};

const personJsonLd = {
  "@context": "https://schema.org", "@type": "Person", name: site.profile.name, jobTitle: site.profile.headline, description: site.profile.description,
  url: siteUrl(), ...(site.profile.email ? { email: `mailto:${site.profile.email}` } : {}),
  sameAs: site.socialLinks.filter((l) => !l.hidden && /^https?:/.test(l.href)).map((l) => l.href),
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang={s.defaultLanguage} data-animation={s.animation} suppressHydrationWarning>
    <body className={`${geist.variable} ${mono.variable} relative min-h-screen bg-background font-sans antialiased`} style={themeStyle(s) as React.CSSProperties}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd).replace(/</g, "\\u003c") }} />
      <ThemeProvider attribute="class" defaultTheme={s.defaultTheme} enableSystem={s.defaultTheme === "system"} disableTransitionOnChange>
        <SiteProvider initial={site}>
          <LocaleProvider defaultLanguage={s.defaultLanguage}>
            <TooltipProvider delayDuration={0}>
              {s.backgroundGrid && <BackgroundGrid />}
              <SiteHeader />
              <main id="main" tabIndex={-1} className={`portfolio-shell relative z-10 mx-auto w-full ${shellWidthClass(s.contentWidth)} px-4 pt-24 pb-32 outline-none sm:px-8 sm:pt-28`}>{children}</main>
              <Navbar />
            </TooltipProvider>
          </LocaleProvider>
        </SiteProvider>
      </ThemeProvider>
    </body>
  </html>;
}
