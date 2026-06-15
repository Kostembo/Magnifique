"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EventCard, type EventCardData } from "@/components/events/event-card";
import { Plus, AlertTriangle } from "lucide-react";
import dynamic from "next/dynamic";
const EventsCalendar = dynamic(() => import("./events-calendar").then((m) => m.EventsCalendar), { ssr: false });

interface Props {
  events: EventCardData[];
}

function calcUrgency(event: EventCardData): number {
  const startsAt = new Date(event.starts_at);
  const hoursUntil = (startsAt.getTime() - Date.now()) / (1000 * 60 * 60);
  if (hoursUntil < 0) return -1; // уже прошло

  const totalConfirmed = event.positions.reduce((s, p) => s + p._count.assignments, 0);
  const totalNeeded = event.positions.reduce((s, p) => s + p.needed_count, 0);
  const missing = Math.max(0, totalNeeded - totalConfirmed);

  if (missing === 0) return 0; // укомплектовано, в конец

  // urgency = (1/дней) * (недобор%)
  const days = Math.max(0.1, hoursUntil / 24);
  const missingRatio = totalNeeded > 0 ? missing / totalNeeded : 0;
  return (1 / days) * missingRatio;
}

export function EventsManager({ events }: Props) {
  const [view, setView] = useState<"list" | "calendar">("list");

  const needsStaff = events.filter((e) => {
    const conf = e.positions.reduce((s, p) => s + p._count.assignments, 0);
    const needed = e.positions.reduce((s, p) => s + p.needed_count, 0);
    return conf < needed && !["done", "staffed"].includes(e.status);
  }).length;

  const sorted = useMemo(
    () => [...events].sort((a, b) => calcUrgency(b) - calcUrgency(a)),
    [events]
  );

  return (
    <div className={view === "calendar" ? "space-y-4" : "p-4 md:p-6 space-y-4"}>
      {/* Header */}
      <div className={`flex items-center justify-between gap-3 ${view === "calendar" ? "px-4 md:px-6 pt-4 md:pt-6" : ""}`}>
        <h1 className="text-2xl font-semibold">Мероприятия</h1>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border overflow-hidden">
            <button
              onClick={() => setView("list")}
              className={`px-3 py-1.5 text-sm font-medium transition-colors min-h-0 ${
                view === "list" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              }`}
            >
              Список
            </button>
            <button
              onClick={() => setView("calendar")}
              className={`px-3 py-1.5 text-sm font-medium transition-colors min-h-0 ${
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
          {sorted.length === 0 && (
            <div className="text-center text-muted-foreground py-16">
              <p className="text-lg font-medium mb-2">Нет активных мероприятий</p>
              <Button asChild variant="outline">
                <Link href="/events/new">Создать первое</Link>
              </Button>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {sorted.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </>
      )}

      {view === "calendar" && (
        <div className="px-4 md:px-6 pb-4 md:pb-6">
          <EventsCalendar events={events} />
        </div>
      )}

      {/* Mobile FAB */}
      <Link
        href="/events/new"
        className="md:hidden fixed bottom-6 right-6 z-30 flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg active:scale-95 transition-transform"
        aria-label="Создать мероприятие"
        style={{ bottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
      >
        <Plus className="h-6 w-6" />
      </Link>
    </div>
  );
}
