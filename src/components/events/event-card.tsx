"use client";

import Link from "next/link";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { MapPin, Clock, User, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StaffingBar } from "./staffing-bar";
import { cn } from "@/lib/utils";

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

const EVENT_STATUS_COLORS: Record<string, string> = {
  draft: "secondary",
  recruiting: "warning",
  staffed: "success",
  done: "outline",
};

const STATUS_LABELS: Record<string, string> = {
  recruiting: "Набор",
  staffed: "Готово",
  done: "Завершено",
  draft: "Черновик",
};

export function EventCard({ event }: { event: EventCardData }) {
  const startsAt = new Date(event.starts_at);
  const totalConfirmed = event.positions.reduce((s, p) => s + p._count.assignments, 0);
  const totalNeeded = event.positions.reduce((s, p) => s + p.needed_count, 0);
  const commentCount = event._count?.comments ?? 0;
  const daysUntil = Math.ceil((startsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const isUrgent = daysUntil <= 3 && totalConfirmed < totalNeeded;

  return (
    <Link href={`/events/${event.id}`}>
      <div
        className={cn(
          "rounded-xl border bg-card p-4 space-y-3 cursor-pointer",
          "shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)]",
          "hover:shadow-[0_4px_12px_rgba(0,0,0,0.08),0_12px_32px_rgba(0,0,0,0.12)]",
          "hover:-translate-y-0.5 transition-all duration-150",
          isUrgent && "border-red-300 bg-red-50/40"
        )}
      >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="font-semibold line-clamp-2 tracking-[-0.01em]">{event.title}</p>
              {event.client && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                  <User className="h-3 w-3 shrink-0" />
                  {event.client}
                </p>
              )}
            </div>
            <Badge variant={EVENT_STATUS_COLORS[event.status] as "secondary" | "warning" | "success" | "outline" | undefined}>
              {STATUS_LABELS[event.status] ?? "Черновик"}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {format(startsAt, "d MMM, HH:mm", { locale: ru })}
              {daysUntil === 0 && <span className="text-red-600 font-medium ml-1">сегодня</span>}
              {daysUntil === 1 && <span className="text-orange-500 font-medium ml-1">завтра</span>}
            </span>
            {event.location && (
              <span className="flex items-center gap-1 truncate">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {event.location}
              </span>
            )}
          </div>

          {totalNeeded > 0 && (
            <StaffingBar confirmed={totalConfirmed} needed={totalNeeded} />
          )}

          {commentCount > 0 && (
            <div className="flex items-center gap-2 pt-1">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MessageSquare className="h-3.5 w-3.5" />
                {commentCount}
              </span>
            </div>
          )}
      </div>
    </Link>
  );
}
