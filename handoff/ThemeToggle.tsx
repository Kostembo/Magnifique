"use client";
// ============================================================
// src/components/settings/theme-toggle.tsx
// Сегмент-переключатель темы для страницы настроек.
// Светлая / Тёмная / Системная. Использует useTheme() из @/lib/theme.
// ============================================================
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/lib/theme";

const OPTIONS = [
  { key: "light", label: "Светлая", Icon: Sun },
  { key: "dark", label: "Тёмная", Icon: Moon },
  { key: "system", label: "Системная", Icon: Monitor },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="space-y-3">
      <div>
        <p className="font-display text-[15px] font-semibold tracking-[-0.01em]">Оформление</p>
        <p className="text-[13px] text-muted-foreground">Выберите тему интерфейса</p>
      </div>

      <div className="grid grid-cols-3 gap-2 rounded-2xl border border-border bg-card p-1.5">
        {OPTIONS.map(({ key, label, Icon }) => {
          const active = theme === key;
          return (
            <button
              key={key}
              onClick={() => setTheme(key)}
              aria-pressed={active}
              className={[
                "flex min-h-[44px] flex-col items-center justify-center gap-1 rounded-xl px-2 py-2.5 text-[12px] font-semibold transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              ].join(" ")}
            >
              <Icon className="h-[18px] w-[18px]" />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// На странице настроек (src/app/(dashboard)/settings/...) просто:
//   <ThemeToggle />
// (lucide-react у тебя уже есть как зависимость shadcn — новый пакет не нужен.)
