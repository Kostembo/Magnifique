"use client";

import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Check, MapPin, Clock } from "lucide-react";

type Shift = {
  id: string;
  event: {
    id: string;
    title: string;
    client?: string | null;
    location?: string | null;
    starts_at: Date | string;
    status: string;
  };
};

export function EventsStaff({ shifts }: { shifts: Shift[] }) {
  return (
    <div className="p-4 md:p-6 space-y-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold">Мои смены</h1>

      {shifts.length === 0 ? (
        <p className="text-muted-foreground text-sm">Нет предстоящих смен</p>
      ) : (
        shifts.map((shift) => (
          <div
            key={shift.id}
            className="rounded-xl border bg-card text-card-foreground p-4 space-y-2 shadow-sm"
          >
            <p className="font-semibold text-base">{shift.event.title}</p>

            <div className="space-y-1 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <Clock className="h-4 w-4 shrink-0" />
                {format(new Date(shift.event.starts_at), "d MMMM yyyy, HH:mm", { locale: ru })}
              </p>
              {shift.event.location && (
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0" />
                  {shift.event.location}
                </p>
              )}
              {shift.event.client && (
                <p className="text-muted-foreground">{shift.event.client}</p>
              )}
            </div>

            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
              <Check className="h-3 w-3" />
              Подтверждено
            </span>
          </div>
        ))
      )}
    </div>
  );
}
