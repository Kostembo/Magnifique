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
  done: "bg-zinc-600",
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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setMonth((m) => subMonths(m, 1))}
          className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="font-semibold text-zinc-100 capitalize">
          {format(month, "LLLL yyyy", { locale: ru })}
        </span>
        <button
          onClick={() => setMonth((m) => addMonths(m, 1))}
          className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 text-center mb-1">
        {DAYS.map((d) => (
          <div key={d} className="text-xs font-medium text-zinc-500 py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
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
                "flex flex-col items-center gap-0.5 py-1 rounded-xl transition-colors",
                inMonth ? "hover:bg-zinc-800 active:bg-zinc-700" : "opacity-20 cursor-default pointer-events-none",
                today ? "bg-[hsl(38_62%_48%/0.12)]" : "",
              ].join(" ")}
            >
              <span
                className={[
                  "text-sm w-7 h-7 flex items-center justify-center rounded-full font-medium",
                  today
                    ? "bg-[hsl(38,62%,48%)] text-zinc-950 font-bold"
                    : inMonth ? "text-zinc-100" : "text-zinc-600",
                ].join(" ")}
              >
                {format(day, "d")}
              </span>
              <div className="flex gap-0.5 h-1.5 items-center">
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
