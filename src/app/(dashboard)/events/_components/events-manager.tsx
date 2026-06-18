"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EventCard, type EventCardData } from "@/components/events/event-card";
import { Plus, AlertTriangle, X } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import dynamic from "next/dynamic";
const EventsCalendar = dynamic(() => import("./events-calendar").then((m) => m.EventsCalendar), { ssr: false });

interface Props { events: EventCardData[] }


export function EventsManager({ events }: Props) {
  const [view, setView] = useState<"list" | "calendar">("list");
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

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
    const base = [...events].sort((a, b) => {
      const at = new Date(a.starts_at).getTime() - now;
      const bt = new Date(b.starts_at).getTime() - now;
      if (at >= 0 && bt < 0) return -1;
      if (at < 0 && bt >= 0) return 1;
      return at - bt;
    });
    if (!selectedDay) return base;
    return base.filter((e) => format(new Date(e.starts_at), "yyyy-MM-dd") === selectedDay);
  }, [events, selectedDay]);

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Мероприятия</h1>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border overflow-hidden">
            <button
              onClick={() => { setView("list"); setSelectedDay(null); }}
              className={`w-24 py-1.5 text-sm font-medium text-center transition-colors min-h-0 ${
                view === "list" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              }`}
            >
              Список
            </button>
            <button
              onClick={() => setView("calendar")}
              className={`w-24 py-1.5 text-sm font-medium text-center transition-colors min-h-0 ${
                view === "calendar" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              }`}
            >
              Календарь
            </button>
          </div>
          <Button asChild size="icon">
            <Link href="/events/new" aria-label="Создать мероприятие">
              <Plus className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Alert bar */}
      {needsStaff > 0 && (
        <div className="flex items-center gap-3 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
          <span className="text-sm text-amber-800 font-medium">
            {needsStaff} {needsStaff === 1 ? "мероприятие требует" : "мероприятий требуют"} добора персонала
          </span>
        </div>
      )}

      {view === "list" && (
        <>
          {/* Фильтр по дню */}
          {selectedDay && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-400">Фильтр:</span>
              <span className="flex items-center gap-1.5 bg-zinc-800 text-zinc-100 text-sm px-3 py-1 rounded-full">
                {format(new Date(selectedDay + "T00:00:00"), "d MMMM yyyy", { locale: ru })}
                <button onClick={() => setSelectedDay(null)} className="text-zinc-400 hover:text-zinc-100 transition-colors ml-1">
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            </div>
          )}

          {displayed.length === 0 && (
            <div className="text-center text-zinc-400 py-16">
              <p className="text-lg font-medium mb-2">
                {selectedDay ? "Нет мероприятий в этот день" : "Нет активных мероприятий"}
              </p>
              {!selectedDay && (
                <Button asChild variant="outline">
                  <Link href="/events/new">Создать первое</Link>
                </Button>
              )}
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
