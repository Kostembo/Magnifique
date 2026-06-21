// ============================================================
// src/app/fonts.ts  (или прямо в layout.tsx)
// Подключение Sora + Hanken Grotesk через next/font (без внешних запросов в рантайме)
// ============================================================
import { Sora, Hanken_Grotesk } from "next/font/google";

export const sora = Sora({
  subsets: ["latin", "cyrillic"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-sora",
  display: "swap",
});

export const hanken = Hanken_Grotesk({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-hanken",
  display: "swap",
});

// В layout.tsx навесь переменные на <html> (рядом с твоим --font-garamond):
//
//   <html lang="ru" className={`${sora.variable} ${hanken.variable} ${garamond.variable}`}>
//
// и в globals.css сделай body шрифтом Hanken:
//   body { font-family: var(--font-hanken), ui-sans-serif, system-ui, sans-serif; }
//
// Заголовки — класс font-display (Sora) + font-extrabold + tracking-[-0.02em].
