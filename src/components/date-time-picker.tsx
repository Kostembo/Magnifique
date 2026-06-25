"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  format,
  getDaysInMonth,
  startOfMonth,
  getDay,
  addMonths,
  subMonths,
  isToday,
} from "date-fns";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface DateTimePickerProps {
  value?: string;
  onChange: (val: string) => void;
  mode?: "date" | "datetime";
  placeholder?: string;
  className?: string;
}

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const MONTHS = [
  "Январь","Февраль","Март","Апрель","Май","Июнь",
  "Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь",
];

export function DateTimePicker({ value, onChange, mode = "date", placeholder, className }: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState<Date>(() => {
    if (value) { const d = new Date(value); if (!isNaN(d.getTime())) return d; }
    return new Date();
  });
  const [time, setTime] = useState<string>(() =>
    value && mode === "datetime" ? (value.split("T")[1]?.slice(0, 5) ?? "00:00") : "00:00"
  );

  const ref = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, close]);

  const selectedDate = value
    ? (mode === "datetime" ? value.split("T")[0] : value)
    : "";

  function displayValue() {
    if (!value) return null;
    try {
      if (mode === "datetime") {
        const [d, t] = value.split("T");
        return `${format(new Date(`${d}T00:00:00`), "dd.MM.yyyy")} ${t?.slice(0, 5) ?? ""}`;
      }
      return format(new Date(`${value}T00:00:00`), "dd.MM.yyyy");
    } catch { return null; }
  }

  function pickDay(day: number) {
    const dateStr = format(new Date(viewDate.getFullYear(), viewDate.getMonth(), day), "yyyy-MM-dd");
    if (mode === "date") { onChange(dateStr); close(); }
    else onChange(`${dateStr}T${time}`);
  }

  function onTimeChange(t: string) {
    setTime(t);
    if (selectedDate) onChange(`${selectedDate}T${t}`);
  }

  function goToday() {
    const today = new Date();
    const dateStr = format(today, "yyyy-MM-dd");
    const nowTime = format(today, "HH:mm");
    setViewDate(today);
    if (mode === "date") { onChange(dateStr); close(); }
    else { setTime(nowTime); onChange(`${dateStr}T${nowTime}`); }
  }

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = getDaysInMonth(new Date(year, month));
  const firstDow = (getDay(startOfMonth(new Date(year, month))) + 6) % 7;
  const cells = Math.ceil((firstDow + daysInMonth) / 7) * 7;

  const display = displayValue();

  return (
    <div ref={ref} className={cn("relative", className)}>
      {/* Триггер */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-10 w-full items-center gap-2 rounded-md border border-input bg-input px-3 text-sm",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors",
          "hover:border-ring/50",
          open && "border-ring ring-2 ring-ring/30",
        )}
      >
        <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className={display ? "text-foreground flex-1 text-left" : "text-muted-foreground flex-1 text-left"}>
          {display ?? (placeholder ?? (mode === "datetime" ? "ДД.ММ.ГГГГ ЧЧ:ММ" : "ДД.ММ.ГГГГ"))}
        </span>
      </button>

      {/* Попап */}
      {open && (
        <div className={cn(
          "absolute left-0 z-[200] mt-1.5 w-72 rounded-xl border border-border bg-card shadow-2xl",
          "overflow-hidden"
        )}>
          {/* Золотая полоса сверху — маркер бренда */}
          <div className="h-0.5 bg-primary w-full" />

          <div className="p-3">
            {/* Навигация по месяцу */}
            <div className="flex items-center mb-3 gap-1">
              <button
                type="button"
                onClick={() => setViewDate(subMonths(viewDate, 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground shrink-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="flex-1 text-center text-sm font-semibold text-foreground">
                {MONTHS[month]} {year}
              </span>
              <button
                type="button"
                onClick={() => setViewDate(addMonths(viewDate, 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground shrink-0"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Дни недели */}
            <div className="grid grid-cols-7 mb-1">
              {WEEKDAYS.map((d) => (
                <div key={d} className="text-center text-[11px] font-medium text-muted-foreground py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Сетка дней */}
            <div className="grid grid-cols-7 gap-y-0.5">
              {Array.from({ length: cells }, (_, i) => {
                const day = i - firstDow + 1;
                const inMonth = day >= 1 && day <= daysInMonth;
                if (!inMonth) return <div key={i} />;

                const dateStr = format(new Date(year, month, day), "yyyy-MM-dd");
                const isSelected = dateStr === selectedDate;
                const isTodayDay = isToday(new Date(year, month, day));

                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => pickDay(day)}
                    className={cn(
                      "mx-auto flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors",
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : isTodayDay
                        ? "ring-1 ring-primary text-primary hover:bg-accent"
                        : "text-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {/* Время (только для datetime) */}
            {mode === "datetime" && (
              <div className="mt-3 pt-3 border-t border-border">
                <input
                  type="time"
                  value={time}
                  onChange={(e) => onTimeChange(e.target.value)}
                  className="w-full h-9 rounded-lg border border-input bg-input px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            )}
          </div>

          {/* Футер */}
          <div className="flex items-center justify-between border-t border-border px-3 py-2 bg-muted/30">
            <button
              type="button"
              onClick={() => { onChange(""); close(); }}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1 rounded"
            >
              Удалить
            </button>
            <button
              type="button"
              onClick={goToday}
              className="text-xs text-primary hover:text-primary/80 font-medium transition-colors px-2 py-1 rounded hover:bg-accent"
            >
              Сегодня
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
