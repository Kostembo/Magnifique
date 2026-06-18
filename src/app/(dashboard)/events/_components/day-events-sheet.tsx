"use client";

import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { X } from "lucide-react";
import { EventCard, type EventCardData } from "@/components/events/event-card";

interface Props {
  date: string | null;
  events: EventCardData[];
  onClose: () => void;
}

export function DayEventsSheet({ date, events, onClose }: Props) {
  if (!date) return null;

  const label = format(new Date(date + "T00:00:00"), "EEEE, d MMMM", { locale: ru });

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60" onClick={onClose} />
      <div
        className="fixed bottom-0 inset-x-0 z-50 bg-zinc-950 border-t border-zinc-800 rounded-t-2xl max-h-[80vh] flex flex-col"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/60 shrink-0">
          <p className="font-semibold text-zinc-100 capitalize">{label}</p>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-100 transition-colors p-1 -mr-1">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto p-4 space-y-3">
          {events.length === 0 ? (
            <p className="text-zinc-500 text-sm text-center py-8">Нет мероприятий в этот день</p>
          ) : (
            events.map((e) => <EventCard key={e.id} event={e} />)
          )}
        </div>
      </div>
    </>
  );
}
