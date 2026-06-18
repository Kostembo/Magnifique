"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Loader2, MapPin, Clock, UserPlus, CheckCircle2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

type EventSlot = {
  eventId: string;
  positionId: number;
  title: string;
  starts_at: string;
  location: string | null;
  status: string;
  slotsLeft: number;
  neededCount: number;
};

interface Props {
  employee: { id: string; full_name: string; role: string } | null;
  onClose: () => void;
}

const STATUS_LABEL: Record<string, string> = {
  draft: "Черновик", recruiting: "Набор", staffed: "Укомплектовано",
};

export function InviteToEventDialog({ employee, onClose }: Props) {
  const { toast } = useToast();
  const [events, setEvents] = useState<EventSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState<string | null>(null);
  const [done, setDone] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!employee) return;
    setLoading(true);
    setEvents([]);
    setDone(new Set());
    fetch(`/api/employees/${employee.id}/invitable-events`)
      .then((r) => r.json())
      .then(setEvents)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [employee]);

  async function invite(ev: EventSlot) {
    setInviting(ev.eventId);
    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: employee!.id,
          event_id: ev.eventId,
          position_id: ev.positionId,
        }),
      });
      if (res.ok) {
        setDone((prev) => new Set([...prev, ev.eventId]));
        toast({ title: `${employee!.full_name} приглашён на «${ev.title}»`, variant: "success" });
      } else {
        const data = await res.json();
        toast({ title: data.error ?? "Ошибка", variant: "destructive" });
      }
    } finally {
      setInviting(null);
    }
  }

  return (
    <Dialog open={!!employee} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Пригласить: {employee?.full_name}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto -mx-6 px-6 space-y-2 pb-2">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {!loading && events.length === 0 && (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Нет доступных мероприятий для этой роли
            </p>
          )}

          {events.map((ev) => {
            const isDone = done.has(ev.eventId);
            const isInviting = inviting === ev.eventId;

            return (
              <div
                key={ev.eventId}
                className="rounded-xl border p-3.5 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{ev.title}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {format(new Date(ev.starts_at), "d MMM, HH:mm", { locale: ru })}
                      </span>
                      {ev.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {ev.location}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {STATUS_LABEL[ev.status] ?? ev.status}
                      {" · "}
                      {ev.slotsLeft > 0
                        ? `свободно мест: ${ev.slotsLeft}`
                        : "все места заняты"}
                    </p>
                  </div>

                  {isDone ? (
                    <span className="flex items-center gap-1 text-xs text-green-600 font-medium shrink-0 mt-0.5">
                      <CheckCircle2 className="h-4 w-4" />
                      Приглашён
                    </span>
                  ) : (
                    <button
                      onClick={() => invite(ev)}
                      disabled={isInviting || ev.slotsLeft <= 0}
                      className="flex items-center gap-1 text-xs font-medium text-[hsl(38,62%,48%)] hover:text-[hsl(38,62%,38%)] disabled:opacity-40 disabled:cursor-not-allowed shrink-0 mt-0.5 transition-colors"
                    >
                      {isInviting
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <UserPlus className="h-3.5 w-3.5" />}
                      Пригласить
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
