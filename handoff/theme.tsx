"use client";
// ============================================================
// src/lib/theme.tsx — переключение тем БЕЗ внешних пакетов.
// Хранит выбор в localStorage, ставит класс .dark на <html>.
// Поддерживает: "light" | "dark" | "system".
// ============================================================
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "light" | "dark" | "system";
type Ctx = { theme: Theme; setTheme: (t: Theme) => void; resolved: "light" | "dark" };

const ThemeCtx = createContext<Ctx | null>(null);
const STORAGE_KEY = "mq-theme";

function systemPrefersDark() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function apply(theme: Theme) {
  const dark = theme === "dark" || (theme === "system" && systemPrefersDark());
  document.documentElement.classList.toggle("dark", dark);
  return dark ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [resolved, setResolved] = useState<"light" | "dark">("light");

  useEffect(() => {
    const saved = (localStorage.getItem(STORAGE_KEY) as Theme) || "system";
    setThemeState(saved);
    setResolved(apply(saved) as "light" | "dark");

    // реагировать на смену системной темы, если выбрано "system"
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const cur = (localStorage.getItem(STORAGE_KEY) as Theme) || "system";
      if (cur === "system") setResolved(apply("system") as "light" | "dark");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const setTheme = (t: Theme) => {
    localStorage.setItem(STORAGE_KEY, t);
    setThemeState(t);
    setResolved(apply(t) as "light" | "dark");
  };

  return <ThemeCtx.Provider value={{ theme, setTheme, resolved }}>{children}</ThemeCtx.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useTheme должен быть внутри <ThemeProvider>");
  return ctx;
}

// ============================================================
// Анти-мерцание (FOUC): вставь ЭТОТ скрипт в <head> layout.tsx ДО рендера,
// чтобы класс .dark проставился до первой отрисовки.
//
// ВАЖНО для Next.js App Router: добавь suppressHydrationWarning на <html>,
// иначе будет ворнинг — мы меняем класс <html> до гидратации намеренно:
//   <html lang="ru" suppressHydrationWarning className={`${sora.variable} ${hanken.variable}`}>
//
// <script dangerouslySetInnerHTML={{ __html: `
//   (function(){try{
//     var t=localStorage.getItem('mq-theme')||'system';
//     var d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);
//     if(d)document.documentElement.classList.add('dark');
//   }catch(e){}})();
// `}} />
//
// И оберни тело приложения в <ThemeProvider> (в layout.tsx или провайдерах).
// ============================================================
