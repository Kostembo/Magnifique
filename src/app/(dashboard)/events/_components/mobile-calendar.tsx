"use client";

import { useState } from "react";
import {
  startOfMonth, endOfMonth, eachDayOfInterval,
  startOfWeek, endOfWeek, format, isSameMonth, isToday,
  addMonths, subMonths,
} from "date-fns";
import { ru } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { EventCardData } from "@/components/events/event-card";

const DOT: Record<string, string> = {
  draft: "bg-zinc-500",
  recruiting: "bg-blue-500",
  staffed: "bg-green-500",
  done: "bg-zinc-500",
};

const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

interface Props {
  events: EventCardData[];
  onDateClick: (dateStr: string) => void;
}

export function MobileCalendar({ events, onDateClick }: Props) {
  const [month, setMonth] = useState(new Date());

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
  });

  const byDate: Record<string, EventCardData[]> = {};
  for (const e of events) {
    const k = format(new Date(e.starts_at), "yyyy-MM-dd");
    (byDate[k] ??= []).push(e);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Навигация по месяцам */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setMonth((m) => subMonths(m, 1))}
          className="p-2 rounded-lg transition-colors text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-lg md:text-2xl font-semibold capitalize text-zinc-900">
          {format(month, "LLLL yyyy", { locale: ru })}
        </span>
        <button
          onClick={() => setMonth((m) => addMonths(m, 1))}
          className="p-2 rounded-lg transition-colors text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Заголовки дней */}
      <div className="grid grid-cols-7 text-center">
        {DAYS.map((d) => (
          <div key={d} className="text-xs font-medium py-1 text-zinc-400">{d}</div>
        ))}
      </div>

      {/* Сетка дней */}
      <div className="grid grid-cols-7 md:border-l md:border-t md:border-zinc-200">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const evs = byDate[key] ?? [];
          const inMonth = isSameMonth(day, month);
          const today = isToday(day);

          return (
            <button
              key={key}
              disabled={!inMonth}
              onClick={() => onDateClick(key)}
              className={[
                "flex flex-col transition-colors",
                // мобилка — компактные ячейки без скролла
                "items-center gap-0.5 py-1 rounded-xl",
                // десктоп — высокие ячейки с рамками
                "md:items-start md:gap-1 md:p-2 md:h-40 md:rounded-none md:border-r md:border-b md:border-zinc-200",
                inMonth
                  ? "hover:bg-zinc-100 active:bg-zinc-200 md:hover:bg-zinc-50 md:active:bg-zinc-100"
                  : "opacity-20 cursor-default pointer-events-none md:bg-zinc-50",
                today ? "bg-[hsl(38_62%_48%/0.08)]" : "",
              ].join(" ")}
            >
              <span
                className={[
                  "text-sm w-7 h-7 md:text-base md:w-9 md:h-9 flex items-center justify-center rounded-full font-medium",
                  today
                    ? "bg-[hsl(38,62%,48%)] text-zinc-950 font-bold"
                    : inMonth ? "text-zinc-900" : "text-zinc-400",
                ].join(" ")}
              >
                {format(day, "d")}
              </span>
              <div className="flex gap-0.5 items-center flex-wrap">
                {evs.slice(0, 3).map((e, i) => (
                  <span key={i} className={`w-1.5 h-1.5 rounded-full ${DOT[e.status] ?? "bg-zinc-500"}`} />
                ))}
                {evs.length > 3 && (
                  <span className="text-[8px] text-zinc-400 leading-none font-medium">+{evs.length - 3}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
