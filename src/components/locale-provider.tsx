"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { translate, translated, type Language, type MessageKey } from "@/lib/i18n";

type LocaleValue = { language: Language; setLanguage: (lang: Language) => void; t: (key: MessageKey, vars?: Record<string, string | number>) => string };
const LocaleContext = createContext<LocaleValue>({ language: "id", setLanguage: () => {}, t: (k) => translate("id", k) });
const STORAGE_KEY = "portfolio-language";
const changedEvent = "portfolio-language-change";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(changedEvent, callback);
  return () => { window.removeEventListener("storage", callback); window.removeEventListener(changedEvent, callback); };
}
function readStored(): Language | null {
  try { const v = window.localStorage.getItem(STORAGE_KEY); return v === "en" || v === "id" ? v : null; }
  catch { return null; }
}

/** Pilihan bahasa pengunjung disimpan di browser (preferensi pribadi, bukan data situs). */
export function LocaleProvider({ children, defaultLanguage = "id" }: { children: ReactNode; defaultLanguage?: Language }) {
  // useSyncExternalStore mencegah hydration mismatch antara HTML server dan browser.
  const language = useSyncExternalStore(subscribe, () => readStored() ?? defaultLanguage, () => defaultLanguage);
  useEffect(() => { document.documentElement.lang = language; }, [language]);
  const setLanguage = useCallback((lang: Language) => {
    try { window.localStorage.setItem(STORAGE_KEY, lang); } catch { /* mode privat: tetap ganti untuk sesi ini */ }
    window.dispatchEvent(new Event(changedEvent));
  }, []);
  const value = useMemo<LocaleValue>(() => ({ language, setLanguage, t: (key, vars) => translate(language, key, vars) }), [language, setLanguage]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}
export function useLocale() { return useContext(LocaleContext); }
export { translated };
