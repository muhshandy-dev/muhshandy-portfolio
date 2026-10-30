"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useSite } from "@/components/site-provider";
import { useLocale } from "@/components/locale-provider";
import { sectionHasContent } from "@/lib/site-utils";
import { translated } from "@/lib/i18n";

/** Section yang tampil di navigasi (tanpa hero, yang sudah diwakili tombol beranda). */
export function useNavSections() {
  const { data } = useSite();
  const { language } = useLocale();
  return data.sections
    .filter((s) => s.visible && s.id !== "hero" && sectionHasContent(data, s.id))
    .map((s) => ({ id: s.id, label: translated(s, "title", language) || s.id }));
}

/** Section yang sedang dibaca, untuk indikator aktif. */
export function useActiveSection(ids: string[]) {
  const [active, setActive] = useState<string>("hero");
  const key = ids.join(",");
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const offset = window.innerHeight * 0.3;
      let current = "hero";
      for (const id of ["hero", ...key.split(",").filter(Boolean)]) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top - offset <= 0) current = id;
      }
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
        const last = key.split(",").filter(Boolean).at(-1);
        if (last && document.getElementById(last)) current = last;
      }
      setActive(current);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); if (frame) cancelAnimationFrame(frame); };
  }, [key]);
  return active;
}

/** Pindah ke section dengan smooth scroll, memperbarui URL (#anchor) dan memindahkan fokus keyboard. */
export function useGoToSection() {
  const pathname = usePathname();
  return (id: string, event?: { preventDefault: () => void }) => {
    if (pathname !== "/") return; // biarkan link /#id bekerja normal dari halaman lain
    const el = document.getElementById(id);
    if (!el) return;
    event?.preventDefault();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.animation === "off";
    if (id === "hero") window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    else el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    const url = id === "hero" ? window.location.pathname + window.location.search : `#${id}`;
    window.history.pushState(null, "", url);
    const heading = document.getElementById(`${id}-title`);
    heading?.focus({ preventScroll: true });
  };
}
