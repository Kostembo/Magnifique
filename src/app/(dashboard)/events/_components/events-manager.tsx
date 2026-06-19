"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { EventCard, type EventCardData } from "@/components/events/event-card";
import { Plus, AlertTriangle, X } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import dynamic from "next/dynamic";
const EventsCalendar = dynamic(() => import("./events-calendar").then((m) => m.EventsCalendar), { ssr: false });

const STATUS_FILTERS = [
  ["all",        "Все"],
  ["recruiting", "Набор"],
  ["staffed",    "Готовы"],
  ["draft",      "Черновики"],
  ["done",       "Завершены"],
] as const;

interface Props { events: EventCardData[] }

export function EventsManager({ events }: Props) {
  const [view, setView] = useState<"list" | "calendar">("list");
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  function handleDaySelect(dateStr: string) {
    setSelectedDay(dateStr);
    setView("list");
  }

  const needsStaff = events.filter((e) => {
    const conf = e.positions.reduce((s, p) => s + p._count.assignments, 0);
    const needed = e.positions.reduce((s, p) => s + p.needed_count, 0);
    return conf < needed && !["done", "staffed"].includes(e.status);
  }).length;

  const displayed = useMemo(() => {
    const now = Date.now();
    return [...events]
      .filter((e) => statusFilter === "all" || e.status === statusFilter)
      .filter((e) => !selectedDay || format(new Date(e.starts_at), "yyyy-MM-dd") === selectedDay)
      .sort((a, b) => {
        const at = new Date(a.starts_at).getTime() - now;
        const bt = new Date(b.starts_at).getTime() - now;
        if (at >= 0 && bt < 0) return -1;
        if (at < 0 && bt >= 0) return 1;
        return at - bt;
      });
  }, [events, selectedDay, statusFilter]);

  return (
    <div className="px-4 pb-28 pt-4 md:px-6 md:pb-6 space-y-4 max-w-3xl mx-auto md:max-w-none">

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-[28px] font-extrabold tracking-[-0.03em]">
          Мероприятия
        </h1>
        <div className="flex items-center gap-2">
          {/* List / Calendar toggle */}
          <div className="hidden md:flex rounded-xl border border-border overflow-hidden">
            <button
              onClick={() => { setView("list"); setSelectedDay(null); }}
              className={`px-4 py-1.5 text-sm font-medium transition-colors min-h-0 ${
                view === "list" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              }`}
            >
              Список
            </button>
            <button
              onClick={() => setView("calendar")}
              className={`px-4 py-1.5 text-sm font-medium transition-colors min-h-0 ${
                view === "calendar" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              }`}
            >
              Календарь
            </button>
          </div>
          <Link
            href="/events/new"
            aria-label="Создать мероприятие"
            className="hidden md:flex items-center justify-center w-9 h-9 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity min-h-0"
          >
            <Plus className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Alert bar */}
      {needsStaff > 0 && (
        <div className="flex items-center gap-3 rounded-2xl px-4 py-3"
          style={{ background: "hsl(var(--warn) / 0.1)", border: "1px solid hsl(var(--warn) / 0.25)" }}>
          <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: "hsl(var(--warn))" }} />
          <span className="text-sm font-medium" style={{ color: "hsl(var(--warn))" }}>
            {needsStaff} {needsStaff === 1 ? "мероприятие требует" : "мероприятий требуют"} добора персонала
          </span>
        </div>
      )}

      {view === "list" && (
        <>
          {/* Status filter chips */}
          <div className="flex gap-2 overflow-x-auto -mx-4 px-4 md:-mx-6 md:px-6 pb-1 no-scrollbar">
            {STATUS_FILTERS.map(([val, label]) => {
              const active = statusFilter === val;
              return (
                <button
                  key={val}
                  onClick={() => setStatusFilter(val)}
                  className="shrink-0 px-4 h-9 rounded-full text-[13px] font-semibold transition-colors min-h-0"
                  style={active
                    ? { background: "linear-gradient(180deg,#FFD27A,hsl(var(--primary)))", color: "hsl(var(--primary-foreground))" }
                    : { background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }
                  }
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Day filter badge */}
          {selectedDay && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">День:</span>
              <span className="inline-flex items-center gap-1.5 bg-muted text-foreground text-sm px-3 py-1 rounded-full">
                {format(new Date(selectedDay + "T00:00:00"), "d MMMM yyyy", { locale: ru })}
                <button onClick={() => setSelectedDay(null)} className="text-muted-foreground hover:text-foreground transition-colors ml-1 min-h-0 min-w-0 h-auto w-auto p-0">
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            </div>
          )}

          {/* Empty state */}
          {displayed.length === 0 && (
            <div className="text-center text-muted-foreground py-16">
              <p className="text-lg font-medium mb-2">
                {selectedDay ? "Нет мероприятий в этот день" : "Нет мероприятий"}
              </p>
              {!selectedDay && statusFilter === "all" && (
                <Link href="/events/new" className="text-sm text-primary hover:underline">
                  Создать первое
                </Link>
              )}
            </div>
          )}

          {/* Cards */}
          <div className="flex flex-col gap-3 md:grid md:grid-cols-2 xl:grid-cols-3">
            {displayed.map((event) => <EventCard key={event.id} event={event} />)}
          </div>
        </>
      )}

      {view === "calendar" && (
        <div className="max-w-6xl mx-auto">
          <EventsCalendar events={events} onDateClick={handleDaySelect} />
        </div>
      )}

      {/* Mobile FAB */}
      <Link
        href="/events/new"
        className="md:hidden fixed right-5 z-30 flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg active:scale-95 transition-transform"
        aria-label="Создать мероприятие"
        style={{ bottom: "calc(56px + 1.5rem + env(safe-area-inset-bottom))" }}
      >
        <Plus className="h-6 w-6" />
      </Link>
    </div>
  );
}
