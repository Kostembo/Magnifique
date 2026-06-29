"use client";

import Link from "next/link";
import { useMemo } from "react";
import { format, startOfWeek, endOfWeek, isThisWeek } from "date-fns";
import { ru } from "date-fns/locale";
import type { CalEvent } from "./month-grid";

const STATUS_DOT: Record<string, string> = {
  draft:      "hsl(240 4% 45%)",
  recruiting: "hsl(38 62% 52%)",
  staffed:    "hsl(142 65% 42%)",
  done:       "hsl(240 4% 30%)",
};

const STATUS_LABEL: Record<string, string> = {
  draft: "Черновик", recruiting: "Набор", staffed: "Готово", done: "Завершено",
};

export function WeekList({ events }: { events: CalEvent[] }) {
  const groups = useMemo(() => {
    const sorted = [...events].sort(
      (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
    );
    const map = new Map<string, CalEvent[]>();
    for (const e of sorted) {
      const ws = startOfWeek(new Date(e.starts_at), { weekStartsOn: 1 });
      const key = format(ws, "yyyy-MM-dd");
      const arr = map.get(key) ?? [];
      arr.push(e);
      map.set(key, arr);
    }
    return Array.from(map.entries());
  }, [events]);

  if (groups.length === 0) {
    return (
      <p className="text-muted-foreground text-sm py-12 text-center">Нет мероприятий</p>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map(([key, groupEvents]) => {
        const ws = new Date(key);
        const we = endOfWeek(ws, { weekStartsOn: 1 });
        const thisWeek = isThisWeek(ws, { weekStartsOn: 1 });

        return (
          <div key={key}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                {thisWeek
                  ? "Эта неделя"
                  : `${format(ws, "d")}–${format(we, "d MMM", { locale: ru })}`}
              </span>
              <div className="flex-1 h-px" style={{ background: "hsl(var(--border))" }} />
              <span className="text-[11px] text-muted-foreground">{groupEvents.length}</span>
            </div>

            <div className="space-y-1.5">
              {groupEvents.map((e) => {
                const dot = STATUS_DOT[e.status] ?? STATUS_DOT.draft;
                return (
                  <Link
                    key={e.id}
                    href={`/events/${e.id}`}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors hover:bg-muted/40"
                    style={{ border: "1px solid hsl(var(--border))" }}
                  >
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: dot }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{e.title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {format(new Date(e.starts_at), "d MMMM, HH:mm", { locale: ru })}
                      </p>
                    </div>
                    <span className="text-[10px] font-semibold shrink-0" style={{ color: dot }}>
                      {STATUS_LABEL[e.status] ?? e.status}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
