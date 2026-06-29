"use client";

import { useMemo, useState } from "react";
import { LayoutList, CalendarDays } from "lucide-react";
import { MonthGrid } from "./month-grid";
import { WeekList } from "./week-list";

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

type View = "list" | "calendar";

export function EventsStaff({ shifts }: { shifts: Shift[] }) {
  const [view, setView] = useState<View>("list");

  const calEvents = useMemo(
    () =>
      shifts.map((s) => ({
        id: s.event.id,
        title: s.event.title,
        starts_at: s.event.starts_at,
        status: s.event.status,
      })),
    [shifts]
  );

  return (
    <div className="px-4 pb-28 pt-4 md:px-6 md:pb-6 space-y-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-[28px] font-extrabold tracking-[-0.03em]">Мои смены</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            {shifts.length} подтверждённых смен
          </p>
        </div>

        <div className="flex items-center rounded-xl overflow-hidden" style={{ border: "1px solid hsl(var(--border))" }}>
          <button
            onClick={() => setView("list")}
            className="flex items-center justify-center w-8 h-8 transition-colors"
            style={view === "list"
              ? { background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }
              : { color: "hsl(var(--muted-foreground))" }}
            aria-label="Список"
          >
            <LayoutList className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView("calendar")}
            className="p-2 transition-colors"
            style={view === "calendar"
              ? { background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }
              : { color: "hsl(var(--muted-foreground))" }}
            aria-label="Календарь"
          >
            <CalendarDays className="h-4 w-4" />
          </button>
        </div>
      </div>

      {view === "list" && <WeekList events={calEvents} />}
      {view === "calendar" && <MonthGrid events={calEvents} />}
    </div>
  );
}
