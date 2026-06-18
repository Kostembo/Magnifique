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

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const pad = (h: number) => `${String(h).padStart(2, "0")}:00`;
const parseHour = (t: string) => parseInt(t.split(":")[0], 10);

function calcHours(startH: number, endH: number): number {
  return endH > startH ? endH - startH : endH + 24 - startH;
}

function TimeForm({
  assignment,
  onSaved,
}: {
  assignment: Assignment;
  onSaved: (entry: TimeEntry) => void;
}) {
  const eventDate = format(new Date(assignment.event.starts_at), "yyyy-MM-dd");
  const [startH, setStartH] = useState(() =>
    assignment.timeEntry ? parseHour(assignment.timeEntry.start_time) : 9
  );
  const [endH, setEndH] = useState(() =>
    assignment.timeEntry ? parseHour(assignment.timeEntry.end_time) : 18
  );
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const total = calcHours(startH, endH);

  async function save() {
    if (total <= 0) {
      toast({ title: "Конец должен быть позже начала", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/time-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: assignment.event_id,
          work_date: eventDate,
          start_time: pad(startH),
          end_time: pad(endH),
        }),
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

  const selectCls =
    "bg-white border border-zinc-300 text-zinc-900 rounded-lg px-2 py-2.5 text-base focus:outline-none focus:ring-1 focus:ring-[hsl(38,62%,48%)] w-full appearance-none text-center";

  return (
    <div className="mt-4 space-y-3">
      <div className="grid grid-cols-3 gap-2 items-end">
        <div className="space-y-1">
          <p className="text-xs text-zinc-500 text-center">С</p>
          <select value={startH} onChange={(e) => setStartH(Number(e.target.value))} className={selectCls}>
            {HOURS.map((h) => <option key={h} value={h}>{h}:00</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-zinc-500 text-center">До</p>
          <select value={endH} onChange={(e) => setEndH(Number(e.target.value))} className={selectCls}>
            {HOURS.map((h) => <option key={h} value={h}>{h}:00</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-zinc-500 text-center">Итого</p>
          <div className="bg-zinc-100 border border-zinc-200 rounded-lg py-2.5 text-base font-semibold text-center text-[hsl(38,72%,42%)]">
            {total > 0 ? `${total} ч` : "—"}
          </div>
        </div>
      </div>

      <Button onClick={save} disabled={saving || total <= 0} className="w-full">
        {saving ? "Сохранение…" : "Сохранить"}
      </Button>
    </div>
  );
}

export function StaffTimesheet({ initial }: { initial: Assignment[] }) {
  const [assignments, setAssignments] = useState(initial);
  const [expanded, setExpanded] = useState<string | null>(null);

  function updateEntry(eventId: string, entry: TimeEntry) {
    setAssignments((prev) =>
      prev.map((a) => (a.event_id === eventId ? { ...a, timeEntry: entry } : a))
    );
    setExpanded(null);
  }

  return (
    <div className="space-y-3">
      {assignments.length === 0 && (
        <p className="text-zinc-400 text-sm py-8 text-center">Нет мероприятий</p>
      )}
      {assignments.map((a) => {
        const isOpen = expanded === a.event_id;
        const logged = !!a.timeEntry;
        const startH = logged ? parseHour(a.timeEntry!.start_time) : null;
        const endH = logged ? parseHour(a.timeEntry!.end_time) : null;
        const total = startH !== null && endH !== null ? calcHours(startH, endH) : 0;

        return (
          <div key={a.id} className="bg-white border border-zinc-200 rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-zinc-900 truncate">{a.event.title}</p>
                <p className="text-sm text-zinc-400 mt-0.5">
                  {format(new Date(a.event.starts_at), "d MMMM yyyy", { locale: ru })}
                  {a.event.location && ` · ${a.event.location}`}
                </p>
                {logged && !isOpen && (
                  <p className="text-sm text-[hsl(38,72%,42%)] mt-1.5 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    {startH}:00 — {endH}:00 · {total} ч
                  </p>
                )}
              </div>
              <button
                onClick={() => setExpanded(isOpen ? null : a.event_id)}
                className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors shrink-0 mt-0.5"
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
