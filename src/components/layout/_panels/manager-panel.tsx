"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type ManagerEvent = {
  eventId: string;
  title: string;
  starts_at: string;
  status: string;
  totalNeeded: number;
  totalConfirmed: number;
};

export type ManagerData = { events: ManagerEvent[] };

const STATUS_LABEL: Record<string, string> = { draft: "Черновик", recruiting: "Набор" };

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}

export function ManagerPanel({ data, close }: { data: ManagerData; close: () => void }) {
  if (!data.events.length) {
    return <p className="p-5 text-sm text-zinc-500">Нет мероприятий требующих внимания</p>;
  }
  return (
    <div>
      <p className="px-4 pt-4 pb-1 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
        Мероприятия
      </p>
      {data.events.map((ev) => (
        <Link
          key={ev.eventId}
          href={`/events/${ev.eventId}`}
          onClick={close}
          className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-900 transition-colors border-b border-zinc-800/60"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-100 truncate">{ev.title}</p>
            <p className="text-xs text-zinc-500 mt-0.5">
              {fmt(ev.starts_at)} · {STATUS_LABEL[ev.status] ?? ev.status}
            </p>
            <p className={cn("text-xs mt-0.5", ev.totalConfirmed < ev.totalNeeded ? "text-amber-500" : "text-zinc-400")}>
              Подтверждено: {ev.totalConfirmed} / {ev.totalNeeded}
              {ev.totalConfirmed < ev.totalNeeded ? " — нужны люди" : ""}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-zinc-600 shrink-0" />
        </Link>
      ))}
    </div>
  );
}
