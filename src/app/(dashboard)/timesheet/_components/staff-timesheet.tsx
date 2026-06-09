"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Clock, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface TimeEntry { id: string; start_time: string; end_time: string; }
interface Assignment {
  id: string;
  event_id: string;
  event: { title: string; starts_at: string; location: string | null };
  timeEntry: TimeEntry | null;
}

function calcHours(start: string, end: string): string {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins <= 0) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}ч ${m}м` : `${h}ч`;
}

function TimeForm({ assignment, onSaved }: { assignment: Assignment; onSaved: (entry: TimeEntry) => void }) {
  const eventDate = format(new Date(assignment.event.starts_at), "yyyy-MM-dd");
  const [start, setStart] = useState(assignment.timeEntry?.start_time ?? "00:00");
  const [end, setEnd] = useState(assignment.timeEntry?.end_time ?? "00:00");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  async function save() {
    if (!start || !end) return;
    setSaving(true);
    try {
      const res = await fetch("/api/time-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: assignment.event_id, work_date: eventDate, start_time: start, end_time: end }),
      });
      if (!res.ok) throw new Error();
      const entry = await res.json();
      onSaved(entry);
      toast({ title: "Время сохранено" });
    } catch {
      toast({ title: "Ошибка", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-3 flex items-end gap-3 flex-wrap">
      <div className="flex flex-col gap-1">
        <span className="text-xs text-zinc-500">Начало</span>
        <input
          type="time"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[hsl(38,62%,48%)]"
        />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs text-zinc-500">Конец</span>
        <input
          type="time"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[hsl(38,62%,48%)]"
        />
      </div>
      {start && end && (
        <span className="text-sm text-zinc-400 pb-2">{calcHours(start, end)}</span>
      )}
      <Button onClick={save} disabled={saving || !start || !end} size="sm" className="mb-0.5">
        {saving ? "Сохранение..." : "Сохранить"}
      </Button>
    </div>
  );
}

export function StaffTimesheet({ initial }: { initial: Assignment[] }) {
  const [assignments, setAssignments] = useState(initial);
  const [expanded, setExpanded] = useState<string | null>(null);

  function updateEntry(eventId: string, entry: TimeEntry) {
    setAssignments((prev) => prev.map((a) => a.event_id === eventId ? { ...a, timeEntry: entry } : a));
    setExpanded(null);
  }

  return (
    <div className="space-y-3">
      {assignments.length === 0 && (
        <p className="text-zinc-500 text-sm py-8 text-center">Нет подтверждённых мероприятий</p>
      )}
      {assignments.map((a) => {
        const isOpen = expanded === a.event_id;
        const logged = !!a.timeEntry;
        return (
          <div key={a.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-zinc-100 truncate">{a.event.title}</p>
                <p className="text-sm text-zinc-500 mt-0.5">
                  {format(new Date(a.event.starts_at), "d MMMM yyyy", { locale: ru })}
                  {a.event.location && ` · ${a.event.location}`}
                </p>
                {logged && !isOpen && (
                  <p className="text-sm text-[hsl(38,72%,62%)] mt-1 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {a.timeEntry!.start_time} — {a.timeEntry!.end_time} · {calcHours(a.timeEntry!.start_time, a.timeEntry!.end_time)}
                  </p>
                )}
              </div>
              <button
                onClick={() => setExpanded(isOpen ? null : a.event_id)}
                className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-100 transition-colors shrink-0 mt-0.5"
              >
                <Clock className="h-4 w-4" />
                {logged ? "Изменить" : "Отметить"}
                {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            </div>
            {isOpen && (
              <TimeForm assignment={a} onSaved={(entry) => updateEntry(a.event_id, entry)} />
            )}
          </div>
        );
      })}
    </div>
  );
}
