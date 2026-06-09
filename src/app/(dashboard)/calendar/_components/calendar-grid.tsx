"use client";

import { useState } from "react";
import { addMonths, subMonths, format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, isSameDay } from "date-fns";
import { ru } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

interface CalendarEvent {
  id: string;
  title: string;
  starts_at: string;
  status: string;
}

const STATUS_COLORS: Record<string, string> = {
  draft:      "bg-zinc-700 text-zinc-300",
  recruiting: "bg-blue-900/60 text-blue-300",
  staffed:    "bg-emerald-900/60 text-emerald-300",
  done:       "bg-zinc-800 text-zinc-500",
  cancelled:  "bg-red-900/40 text-red-400 line-through",
};

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export function CalendarGrid({ events }: { events: CalendarEvent[] }) {
  const [month, setMonth] = useState(startOfMonth(new Date()));

  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start, end });

  function eventsForDay(day: Date) {
    return events.filter((e) => isSameDay(new Date(e.starts_at), day));
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => setMonth(subMonths(month, 1))} className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-zinc-100 font-medium capitalize min-w-[180px] text-center">
          {format(month, "LLLL yyyy", { locale: ru })}
        </span>
        <button onClick={() => setMonth(addMonths(month, 1))} className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Grid */}
      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-zinc-800">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-medium text-zinc-500">
              {d}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const dayEvents = eventsForDay(day);
            const inMonth = isSameMonth(day, month);
            const today = isToday(day);
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;

            return (
              <div
                key={i}
                className={`min-h-[80px] p-1.5 border-b border-r border-zinc-800/60 last:border-r-0 ${
                  !inMonth ? "bg-zinc-950/50" : ""
                } ${isWeekend && inMonth ? "bg-zinc-900/30" : ""}`}
              >
                <span className={`text-xs font-medium inline-flex items-center justify-center w-6 h-6 rounded-full mb-1 ${
                  today
                    ? "bg-[hsl(38,62%,48%)] text-black font-bold"
                    : inMonth ? "text-zinc-300" : "text-zinc-700"
                }`}>
                  {format(day, "d")}
                </span>

                <div className="space-y-0.5">
                  {dayEvents.slice(0, 3).map((e) => (
                    <Link
                      key={e.id}
                      href={`/events/${e.id}`}
                      className={`block text-[10px] leading-tight px-1.5 py-0.5 rounded truncate font-medium hover:opacity-80 transition-opacity ${STATUS_COLORS[e.status] ?? STATUS_COLORS.draft}`}
                    >
                      {e.title}
                    </Link>
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="text-[10px] text-zinc-500 px-1">+{dayEvents.length - 3}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-zinc-500">
        {[
          { status: "recruiting", label: "Набор" },
          { status: "staffed", label: "Укомплектовано" },
          { status: "done", label: "Завершено" },
        ].map(({ status, label }) => (
          <span key={status} className={`px-2 py-0.5 rounded ${STATUS_COLORS[status]}`}>{label}</span>
        ))}
      </div>
    </div>
  );
}
