"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Clock, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { stagger, fadeUp } from "@/lib/motion";

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

const selectCls = [
  "rounded-2xl px-2 py-2.5 text-base w-full appearance-none text-center focus:outline-none",
  "focus:ring-2 focus:ring-ring",
  "bg-card border border-border text-foreground",
].join(" ");

function TimeForm({ assignment, onSaved }: { assignment: Assignment; onSaved: (entry: TimeEntry) => void }) {
  const eventDate = format(new Date(assignment.event.starts_at), "yyyy-MM-dd");
  const [startH, setStartH] = useState(() => assignment.timeEntry ? parseHour(assignment.timeEntry.start_time) : 9);
  const [endH, setEndH] = useState(() => assignment.timeEntry ? parseHour(assignment.timeEntry.end_time) : 18);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const total = calcHours(startH, endH);

  async function save() {
    if (total <= 0) { toast({ title: "Конец должен быть позже начала", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/time-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: assignment.event_id, work_date: eventDate, start_time: pad(startH), end_time: pad(endH) }),
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
    <div className="mt-4 space-y-3">
      <div className="grid grid-cols-3 gap-2 items-end">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground text-center">С</p>
          <select value={startH} onChange={(e) => setStartH(Number(e.target.value))} className={selectCls}>
            {HOURS.map((h) => <option key={h} value={h}>{h}:00</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground text-center">До</p>
          <select value={endH} onChange={(e) => setEndH(Number(e.target.value))} className={selectCls}>
            {HOURS.map((h) => <option key={h} value={h}>{h}:00</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground text-center">Итого</p>
          <div className="rounded-2xl border border-border py-2.5 text-base font-semibold text-center"
            style={{ color: "hsl(var(--primary))", background: "hsl(var(--muted))" }}>
            {total > 0 ? `${total} ч` : "—"}
          </div>
        </div>
      </div>
      <Button onClick={save} disabled={saving || total <= 0} className="w-full rounded-2xl">
        {saving ? "Сохранение…" : "Сохранить"}
      </Button>
    </div>
  );
}

export function StaffTimesheet({ initial }: { initial: Assignment[] }) {
  const [assignments, setAssignments] = useState(initial);
  const [expanded, setExpanded] = useState<string | null>(null);

  function updateEntry(eventId: string, entry: TimeEntry) {
    setAssignments((prev) => prev.map((a) => (a.event_id === eventId ? { ...a, timeEntry: entry } : a)));
    setExpanded(null);
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-2.5">
      {assignments.length === 0 && (
        <p className="text-muted-foreground text-sm py-10 text-center">Нет мероприятий</p>
      )}
      {assignments.map((a) => {
        const isOpen = expanded === a.event_id;
        const logged = !!a.timeEntry;
        const startH = logged ? parseHour(a.timeEntry!.start_time) : null;
        const endH = logged ? parseHour(a.timeEntry!.end_time) : null;
        const total = startH !== null && endH !== null ? calcHours(startH, endH) : 0;

        return (
          <motion.div key={a.id} variants={fadeUp}
            className="rounded-3xl mq-hair p-4" style={{ background: "hsl(var(--card))" }}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-[15px] truncate">{a.event.title}</p>
                <p className="text-[13px] text-muted-foreground mt-0.5">
                  {format(new Date(a.event.starts_at), "d MMMM yyyy", { locale: ru })}
                  {a.event.location && ` · ${a.event.location}`}
                </p>
                {logged && !isOpen && (
                  <p className="text-[13px] mt-1.5 flex items-center gap-1.5" style={{ color: "hsl(var(--ok))" }}>
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    {startH}:00 — {endH}:00 · {total} ч
                  </p>
                )}
              </div>
              <button
                onClick={() => setExpanded(isOpen ? null : a.event_id)}
                className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors shrink-0 mt-0.5 min-h-0 min-w-0 h-auto w-auto"
              >
                <Clock className="h-4 w-4" />
                {logged ? "Изменить" : "Отметить"}
                {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            </div>
            {isOpen && <TimeForm assignment={a} onSaved={(entry) => updateEntry(a.event_id, entry)} />}
          </motion.div>
        );
      })}
    </motion.div>
  );
}
