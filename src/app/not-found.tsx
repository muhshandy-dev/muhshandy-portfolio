"use client";
import Link from "next/link";
import { Home } from "lucide-react";
import { useLocale } from "@/components/locale-provider";

export default function NotFound() {
  const { t } = useLocale();
  return <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
    <p className="font-mono text-7xl font-semibold tracking-tighter text-primary/40">404</p>
    <h1 className="text-3xl font-semibold tracking-tight">{t("notFoundTitle")}</h1>
    <p className="max-w-md text-muted-foreground">{t("notFoundText")}</p>
    <Link href="/" className="ui-button"><Home className="size-4" aria-hidden />{t("goHome")}</Link>
  </div>;
}
