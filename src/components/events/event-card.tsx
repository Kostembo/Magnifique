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

export function EventCard({ event }: { event: EventCardData }) {
  const startsAt = new Date(event.starts_at);
  const totalConfirmed = event.positions.reduce(
    (s, p) => s + p._count.assignments,
    0
  );
  const totalNeeded = event.positions.reduce((s, p) => s + p.needed_count, 0);

  const commentCount = event._count?.comments ?? 0;

  const daysUntil = Math.ceil(
    (startsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const isUrgent = daysUntil <= 3 && totalConfirmed < totalNeeded;

  return (
    <Link href={`/events/${event.id}`}>
      <div
        className={cn(
          "rounded-lg border bg-card p-4 space-y-3 hover:shadow-md transition-shadow cursor-pointer",
          isUrgent && "border-red-300 bg-red-50/40"
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-semibold line-clamp-2">{event.title}</p>
            {event.client && (
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                <User className="h-3 w-3 shrink-0" />
                {event.client}
              </p>
            )}
          </div>
          <Badge variant={EVENT_STATUS_COLORS[event.status] as "secondary" | "warning" | "success" | "outline" | undefined}>
            {event.status === "recruiting" ? "Набор" : event.status === "staffed" ? "Готово" : event.status === "done" ? "Завершено" : "Черновик"}
          </Badge>
        </div>

        {/* Date & location */}
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

        {/* Staffing bar */}
        {totalNeeded > 0 && (
          <StaffingBar confirmed={totalConfirmed} needed={totalNeeded} />
        )}

        {/* Footer chips */}
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
