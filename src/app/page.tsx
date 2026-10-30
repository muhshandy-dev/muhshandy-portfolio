"use client";

import { PortfolioSection } from "@/components/portfolio/sections";
import { Reveal } from "@/components/reveal";
import { useSite } from "@/components/site-provider";
import { useLocale } from "@/components/locale-provider";
import { hasDemoContent } from "@/lib/site-utils";

export default function Page() {
  const { data, preview } = useSite();
  const { t } = useLocale();
  const showDemo = data.settings.showDemoBanner && hasDemoContent(data);
  return <div className="relative flex min-h-dvh flex-col gap-14 sm:gap-20">
    {preview && <div role="status" className="preview-banner">{t("previewBanner")}</div>}
    {showDemo && <div role="note" className="demo-banner">{t("demoBanner")}</div>}
    {data.sections.filter((s) => s.visible).map((s, idx) => <Reveal key={s.id} delay={Math.min(idx, 3) * 0.04}><PortfolioSection section={s} /></Reveal>)}
    <footer className="pb-4 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} {data.profile.name} · {t("builtWith")}</footer>
  </div>;
}
