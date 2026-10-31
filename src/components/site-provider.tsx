"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { SiteData } from "@/lib/site-schema";
import { themeStyle } from "@/lib/theme";

const SiteContext = createContext<{ data: SiteData; preview: boolean } | null>(null);
export const PREVIEW_MESSAGE = "portfolio-preview";

/**
 * Menyediakan data situs ke komponen klien.
 * Mode pratinjau (URL ?preview=1 di dalam iframe admin, lokal maupun online): menerima draf dari admin
 * lewat postMessage dari origin dan jendela induk yang sama, lalu menampilkannya di peramban itu saja tanpa menyimpan.
 * Pengunjung biasa tidak terpengaruh: tanpa ?preview=1 dan iframe, tidak ada yang dimuat.
 */
export function SiteProvider({ initial, children }: { initial: SiteData; children: ReactNode }) {
  const [data, setData] = useState(initial);
  const [preview, setPreview] = useState(false);
  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has("preview") || window.parent === window) return;
    const onMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== window.parent) return;
      if (event.data?.type !== PREVIEW_MESSAGE) return;
      // Skema (zod) dimuat hanya di mode pratinjau supaya tidak membebani pengunjung biasa.
      const { parseSite } = await import("@/lib/site-schema");
      const parsed = parseSite(event.data.data);
      if (parsed.success) { setData(parsed.data); setPreview(true); }
    };
    window.addEventListener("message", onMessage);
    window.parent.postMessage({ type: `${PREVIEW_MESSAGE}-ready` }, window.location.origin);
    return () => window.removeEventListener("message", onMessage);
  }, []);
  // Saat pratinjau, warna/radius ikut draf (di halaman biasa sudah diatur oleh layout server).
  useEffect(() => {
    if (!preview) return;
    for (const [k, v] of Object.entries(themeStyle(data.settings))) document.body.style.setProperty(k, String(v));
    document.documentElement.dataset.animation = data.settings.animation;
  }, [preview, data.settings]);
  return <SiteContext.Provider value={{ data, preview }}>{children}</SiteContext.Provider>;
}

export function useSite() {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error("useSite harus dipakai di dalam SiteProvider");
  return ctx;
}
