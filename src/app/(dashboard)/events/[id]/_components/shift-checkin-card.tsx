"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Clock, LogIn, LogOut } from "lucide-react";

type TimeEntry = {
  checked_in_at: Date | string | null;
  checked_out_at: Date | string | null;
  calculated_hours: number | null;
  calculated_pay: number | null;
};

interface Props {
  eventId: string;
  initialEntry: TimeEntry | null;
  hasConfirmedAssignment: boolean;
}

export function ShiftCheckinCard({ eventId, initialEntry, hasConfirmedAssignment }: Props) {
  const { toast } = useToast();
  const [entry, setEntry] = useState<TimeEntry | null>(initialEntry);
  const [loading, setLoading] = useState(false);

  if (!hasConfirmedAssignment) return null;

  const isCheckedIn = !!entry?.checked_in_at;
  const isCheckedOut = !!entry?.checked_out_at;

  async function checkin() {
    setLoading(true);
    try {
      const res = await fetch("/api/time-entries/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: eventId }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setEntry({ checked_in_at: data.checked_in_at, checked_out_at: null, calculated_hours: null, calculated_pay: null });
        toast({ title: "Смена начата", variant: "success" });
      } else {
        toast({ title: "Ошибка", description: data.error ?? "Не удалось отметить начало смены", variant: "destructive" });
      }
    } catch {
      toast({ title: "Ошибка", description: "Нет соединения", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function checkout() {
    setLoading(true);
    try {
      const res = await fetch("/api/time-entries/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: eventId }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setEntry((prev) => ({
          ...prev!,
          checked_out_at: data.checked_out_at,
          calculated_hours: data.calculated_hours ? Number(data.calculated_hours) : null,
          calculated_pay: data.calculated_pay ? Number(data.calculated_pay) : null,
        }));
        toast({ title: "Смена завершена", variant: "success" });
      } else {
        toast({ title: "Ошибка", description: data.error ?? "Не удалось завершить смену", variant: "destructive" });
      }
    } catch {
      toast({ title: "Ошибка", description: "Нет соединения", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="rounded-3xl p-4 mq-hair flex items-center gap-4"
      style={{ background: "hsl(var(--card))", borderColor: isCheckedIn && !isCheckedOut ? "hsl(var(--ok))" : undefined }}
    >
      <div className="flex-1 min-w-0 space-y-0.5">
        <p className="text-[13px] font-semibold">
          {isCheckedOut ? "Смена завершена" : isCheckedIn ? "На смене" : "Моя смена"}
        </p>
        {isCheckedIn && entry?.checked_in_at && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <LogIn className="h-3 w-3" />
            {format(new Date(entry.checked_in_at), "HH:mm", { locale: ru })}
            {isCheckedOut && entry.checked_out_at && (
              <> — <LogOut className="h-3 w-3" />{format(new Date(entry.checked_out_at), "HH:mm", { locale: ru })}</>
            )}
          </p>
        )}
        {isCheckedOut && entry?.calculated_hours != null && (
          <p className="text-xs" style={{ color: "hsl(var(--ok))" }}>
            {Number(entry.calculated_hours).toFixed(1)} ч
            {entry.calculated_pay != null && ` · ${Math.round(Number(entry.calculated_pay))} ₽`}
          </p>
        )}
      </div>

      {!isCheckedIn && (
        <Button size="sm" className="rounded-xl shrink-0 gap-1.5" onClick={checkin} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
          На смене
        </Button>
      )}
      {isCheckedIn && !isCheckedOut && (
        <Button size="sm" variant="outline" className="rounded-xl shrink-0 gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10" onClick={checkout} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
          Завершить
        </Button>
      )}
    </div>
  );
}
