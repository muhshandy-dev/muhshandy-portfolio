"use client";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useLocale } from "@/components/locale-provider";

export function ModeToggle({ className = "" }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const { language } = useLocale();
  return <button type="button" className={className} aria-label={language === "id" ? "Ganti mode terang atau gelap" : "Toggle light or dark mode"} title={language === "id" ? "Terang / Gelap" : "Light / Dark"} onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
    <Moon className="size-5 dark:hidden" aria-hidden="true" />
    <Sun className="hidden size-5 dark:block" aria-hidden="true" />
  </button>;
}
