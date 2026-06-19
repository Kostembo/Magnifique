"use client";

import Link from "next/link";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { MessageSquare } from "lucide-react";
import { MagneticCard, StaffBar } from "@/lib/motion";

export type EventCardData = {
  id: string;
  title: string;
  client?: string | null;
  location?: string | null;
  starts_at: Date | string;
  status: string;
  positions: Array<{
    role: string;
    needed_count: number;
    _count: { assignments: number };
  }>;
  _count?: { comments: number };
};

const STATUS: Record<string, { label: string; color: string }> = {
  recruiting: { label: "Набор",          color: "hsl(var(--warn))" },
  staffed:    { label: "Укомплектовано", color: "hsl(var(--info))" },
  draft:      { label: "Черновик",       color: "hsl(var(--muted-foreground))" },
  done:       { label: "Завершено",      color: "hsl(var(--muted-foreground))" },
};

export function EventCard({ event }: { event: EventCardData }) {
  const startsAt = new Date(event.starts_at);
  const totalConfirmed = event.positions.reduce((s, p) => s + p._count.assignments, 0);
  const totalNeeded = event.positions.reduce((s, p) => s + p.needed_count, 0);
  const pct = totalNeeded ? totalConfirmed / totalNeeded : 0;
  const commentCount = event._count?.comments ?? 0;
  const sm = STATUS[event.status] ?? STATUS.draft;
  const pctColor = pct >= 1 ? "hsl(var(--ok))" : pct < 0.5 ? "hsl(var(--bad))" : "hsl(var(--primary))";

  return (
    <Link href={`/events/${event.id}`} className="block">
      <MagneticCard layoutId={`ev-${event.id}`} className="mq-hair cursor-pointer rounded-3xl bg-card p-4">
        {/* Title row */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-display text-[18px] font-extrabold leading-tight tracking-[-0.02em]">
              {event.title}
            </p>
            {event.client && (
              <p className="mt-1 truncate text-[13px] text-muted-foreground">{event.client}</p>
            )}
          </div>
          <span
            className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-semibold"
            style={{ color: sm.color, background: `${sm.color}1f` }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: sm.color }} />
            {sm.label}
          </span>
        </div>

        {/* Meta row */}
        <div className="mt-3 flex items-center gap-4 text-[13px] text-muted-foreground">
          <span>{format(startsAt, "d MMM, HH:mm", { locale: ru })}</span>
          {event.location && <span className="truncate">{event.location}</span>}
        </div>

        {/* Staffing bar */}
        {totalNeeded > 0 && (
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[12px] text-muted-foreground">Бригада</span>
              <span className="font-display text-[12px] font-bold tabular-nums" style={{ color: pctColor }}>
                {totalConfirmed}/{totalNeeded}
              </span>
            </div>
            <StaffBar value={pct} />
          </div>
        )}

        {commentCount > 0 && (
          <div className="mt-3 flex items-center gap-1 text-[12px] text-muted-foreground">
            <MessageSquare className="h-3.5 w-3.5" />
            {commentCount}
          </div>
        )}
      </MagneticCard>
    </Link>
  );
}
