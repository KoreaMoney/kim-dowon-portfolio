"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { portfolioEnglish } from "@/lib/i18n/portfolio-en";

export type Locale = "ko" | "en";
const LocaleContext = createContext<{locale:Locale;setLocale:(locale:Locale)=>void;t:(text:string)=>string} | null>(null);

export function LocaleProvider({children,initialLocale}:{children:ReactNode;initialLocale:Locale}) {
  const [locale,updateLocale] = useState(initialLocale);
  const setLocale = (next:Locale) => {
    document.cookie = `portfolio-locale=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
    updateLocale(next);
  };
  useEffect(() => {
    document.documentElement.lang = locale;
  },[locale]);
  return <LocaleContext.Provider value={{locale,setLocale,t:(text)=>locale==='en' ? portfolioEnglish[text] ?? text : text}}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error('LocaleProvider is required');
  return context;
}
