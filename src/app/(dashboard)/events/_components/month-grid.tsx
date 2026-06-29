"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  format, startOfMonth, endOfMonth,
  startOfWeek, addDays, isSameMonth, isToday,
} from "date-fns";
import { ru } from "date-fns/locale";

export type CalEvent = {
  id: string;
  title: string;
  starts_at: Date | string;
  status: string;
};

// Использует CSS-переменные темы — работает в светлой и тёмной теме
const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  draft:      { bg: "hsl(var(--muted))",        color: "hsl(var(--muted-foreground))" },
  recruiting: { bg: "hsl(var(--warn) / 0.2)",   color: "hsl(var(--warn))" },
  staffed:    { bg: "hsl(var(--ok) / 0.15)",    color: "hsl(var(--ok))" },
  done:       { bg: "hsl(var(--muted) / 0.5)",  color: "hsl(var(--muted-foreground) / 0.6)" },
};

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export function MonthGrid({ events }: { events: CalEvent[] }) {
  const router = useRouter();
  const [current, setCurrent] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const days = useMemo(() => {
    const first = startOfWeek(startOfMonth(current), { weekStartsOn: 1 });
    const last = endOfMonth(current);
    const result: Date[] = [];
    let d = first;
    while (d <= last || result.length % 7 !== 0) {
      result.push(new Date(d));
      d = addDays(d, 1);
    }
    return result;
  }, [current]);

  const byDay = useMemo(() => {
    const map = new Map<string, CalEvent[]>();
    for (const e of events) {
      const key = format(new Date(e.starts_at), "yyyy-MM-dd");
      const arr = map.get(key) ?? [];
      arr.push(e);
      map.set(key, arr);
    }
    return map;
  }, [events]);

  const goMonth = (delta: number) =>
    setCurrent((d) => new Date(d.getFullYear(), d.getMonth() + delta, 1));

  return (
    <div className="flex flex-col gap-3 flex-1 min-h-0">
      {/* Навигация */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => goMonth(-1)}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="flex-1 text-center text-sm font-semibold capitalize">
          {format(current, "LLLL yyyy", { locale: ru })}
        </span>
        <button
          onClick={() => goMonth(1)}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          onClick={() => {
            const n = new Date();
            setCurrent(new Date(n.getFullYear(), n.getMonth(), 1));
          }}
          className="px-3 h-7 rounded-lg text-[11px] font-medium bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          сегодня
        </button>
      </div>

      {/* Дни недели */}
      <div className="grid grid-cols-7">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-[11px] font-medium text-muted-foreground py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Сетка */}
      <div
        className="grid grid-cols-7 gap-px rounded-2xl overflow-hidden flex-1"
        style={{ background: "hsl(var(--border))" }}
      >
        {days.map((day, i) => {
          const key = format(day, "yyyy-MM-dd");
          const dayEvents = byDay.get(key) ?? [];
          const inMonth = isSameMonth(day, current);
          const todayCell = isToday(day);

          return (
            <div
              key={i}
              className="flex flex-col gap-0.5 p-1 md:p-1.5"
              style={{
                minHeight: "clamp(72px, 10vw, 110px)",
                background: todayCell
                  ? "hsl(var(--primary) / 0.06)"
                  : inMonth
                  ? "hsl(var(--card))"
                  : "hsl(var(--background))",
              }}
            >
              <span
                className={`self-end text-[11px] w-5 h-5 flex items-center justify-center rounded-full leading-none shrink-0 ${
                  todayCell
                    ? "bg-primary text-primary-foreground font-bold"
                    : inMonth
                    ? "text-muted-foreground"
                    : "text-muted-foreground/30"
                }`}
              >
                {format(day, "d")}
              </span>

              {dayEvents.slice(0, 3).map((e) => {
                const s = STATUS_STYLE[e.status] ?? STATUS_STYLE.draft;
                return (
                  <button
                    key={e.id}
                    onClick={() => router.push(`/events/${e.id}`)}
                    className="w-full text-left rounded px-1 py-px text-[9px] md:text-[10px] leading-tight font-medium truncate hover:opacity-75 transition-opacity"
                    style={{ background: s.bg, color: s.color }}
                  >
                    {format(new Date(e.starts_at), "HH:mm")} {e.title}
                  </button>
                );
              })}
              {dayEvents.length > 3 && (
                <span className="text-[9px] text-muted-foreground px-0.5">
                  +{dayEvents.length - 3}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
