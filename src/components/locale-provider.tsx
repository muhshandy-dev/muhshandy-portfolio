"use client";

import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react";

type Language = "id" | "en";
const LocaleContext = createContext<{ language: Language; setLanguage: (lang: Language) => void }>({ language: "id", setLanguage: () => {} });
const changedEvent = "portfolio-language-change";
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(changedEvent, callback);
  return () => { window.removeEventListener("storage", callback); window.removeEventListener(changedEvent, callback); };
}
function getClientLanguage(): Language {
  try { return window.localStorage.getItem("portfolio-language") === "en" ? "en" : "id"; }
  catch { return "id"; }
}
function getServerLanguage(): Language { return "id"; }

export function LocaleProvider({ children }: { children: ReactNode }) {
  // useSyncExternalStore avoids a mismatch between server HTML and browser hydration.
  const language = useSyncExternalStore(subscribe, getClientLanguage, getServerLanguage);
  useEffect(() => { document.documentElement.lang = language; }, [language]);
  const setLanguage = (lang: Language) => {
    try { window.localStorage.setItem("portfolio-language", lang); } catch { /* private mode */ }
    window.dispatchEvent(new Event(changedEvent));
  };
  return <LocaleContext.Provider value={{ language, setLanguage }}>{children}</LocaleContext.Provider>;
}
export function useLocale() { return useContext(LocaleContext); }
export function translated<T extends { en?: Record<string, string> }>(obj: T, key: keyof T & string, lang: Language): string {
  const original = obj[key];
  const english = obj.en?.[key];
  return lang === "en" && english?.trim() ? english : String(original ?? "");
}
