"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { EventCard, type EventCardData } from "@/components/events/event-card";
import { Plus, AlertTriangle } from "lucide-react";

const STATUS_FILTERS = [
  ["all",        "Все"],
  ["recruiting", "Набор"],
  ["staffed",    "Готовы"],
  ["draft",      "Черновики"],
  ["done",       "Завершены"],
] as const;

interface Props { events: EventCardData[]; canCreate?: boolean }

export function EventsManager({ events, canCreate = false }: Props) {
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const needsStaff = events.filter((e) => {
    const conf = e.positions.reduce((s, p) => s + p._count.assignments, 0);
    const needed = e.positions.reduce((s, p) => s + p.needed_count, 0);
    return conf < needed && !["done", "staffed"].includes(e.status);
  }).length;

  const displayed = useMemo(() => {
    const now = Date.now();
    return [...events]
      .filter((e) => statusFilter === "all" || e.status === statusFilter)
      .sort((a, b) => {
        const at = new Date(a.starts_at).getTime() - now;
        const bt = new Date(b.starts_at).getTime() - now;
        if (at >= 0 && bt < 0) return -1;
        if (at < 0 && bt >= 0) return 1;
        return at - bt;
      });
  }, [events, statusFilter]);

  return (
    <div className="px-4 pb-28 pt-4 md:px-6 md:pb-6 space-y-4 max-w-3xl mx-auto md:max-w-none">

      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-[28px] font-extrabold tracking-[-0.03em]">Мероприятия</h1>
        {canCreate && (
          <Link
            href="/events/new"
            aria-label="Создать мероприятие"
            className="hidden md:flex items-center justify-center w-9 h-9 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity min-h-0"
          >
            <Plus className="h-4 w-4" />
          </Link>
        )}
      </div>

      {needsStaff > 0 && (
        <div className="flex items-center gap-3 rounded-2xl px-4 py-3"
          style={{ background: "hsl(var(--warn) / 0.1)", border: "1px solid hsl(var(--warn) / 0.25)" }}>
          <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: "hsl(var(--warn))" }} />
          <span className="text-sm font-medium" style={{ color: "hsl(var(--warn))" }}>
            {needsStaff} {needsStaff === 1 ? "мероприятие требует" : "мероприятий требуют"} добора персонала
          </span>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto -mx-4 px-4 md:-mx-6 md:px-6 pb-1 no-scrollbar">
        {STATUS_FILTERS.map(([val, label]) => {
          const active = statusFilter === val;
          return (
            <button
              key={val}
              onClick={() => setStatusFilter(val)}
              className="shrink-0 px-4 h-9 rounded-xl text-[13px] font-semibold transition-colors min-h-0"
              style={active
                ? { background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }
                : { background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }
              }
            >
              {label}
            </button>
          );
        })}
      </div>

      {displayed.length === 0 && (
        <div className="text-center text-muted-foreground py-16">
          <p className="text-lg font-medium mb-2">Нет мероприятий</p>
          {statusFilter === "all" && canCreate && (
            <Link href="/events/new" className="text-sm text-primary hover:underline">
              Создать первое
            </Link>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3 md:grid md:grid-cols-2 xl:grid-cols-3">
        {displayed.map((event) => <EventCard key={event.id} event={event} />)}
      </div>

      {canCreate && (
        <Link
          href="/events/new"
          className="md:hidden fixed right-5 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg active:scale-95 transition-transform"
          aria-label="Создать мероприятие"
          style={{ bottom: "calc(56px + 1.25rem + env(safe-area-inset-bottom, 0px))" }}
        >
          <Plus className="h-6 w-6" />
        </Link>
      )}
    </div>
  );
}
