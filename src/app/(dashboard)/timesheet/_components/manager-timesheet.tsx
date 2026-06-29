"use client";

import { useState } from "react";
import { format, addMonths, subMonths, getDaysInMonth } from "date-fns";
import { ru } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { MobileTimesheetView, type EmpRow } from "./manager-timesheet-mobile";

interface TimeEntry {
  id: string;
  employee_id: string;
  work_date: string;
  start_time: string | null;
  end_time: string | null;
  checked_in_at: string | null;
  checked_out_at: string | null;
  calculated_hours: string | number | null;
  employee: { id: string; full_name: string; role: string };
}

interface EditTarget {
  entryId: string;
  employeeName: string;
  day: number;
  start_time: string | null;
  end_time: string | null;
}

function resolveHHMM(manual: string | null | undefined, auto: string | null | undefined): string | null {
  if (manual) return manual;
  if (auto) {
    // UTC+3 (МСК), как и formatTimeMoscow в lib/payroll
    const d = new Date(new Date(auto).getTime() + 3 * 60 * 60 * 1000);
    return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
  }
  return null;
}

function calcMins(start: string | null, end: string | null): number {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return Math.max(0, (eh * 60 + em) - (sh * 60 + sm));
}

function calcMinsFromEntry(entry: TimeEntry): number {
  if (entry.calculated_hours != null) return Math.floor(Number(entry.calculated_hours)) * 60;
  const raw = calcMins(
    resolveHHMM(entry.start_time, entry.checked_in_at),
    resolveHHMM(entry.end_time, entry.checked_out_at),
  );
  return Math.floor(raw / 60) * 60;
}

function fmtHours(mins: number): string {
  if (!mins) return "0ч";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}ч ${m}м` : `${h}ч`;
}

const ROLE_LABELS: Record<string, string> = {
  waiter: "Официант", cook: "Повар", warehouse: "Склад",
  manager: "Менеджер", owner: "Владелец", admin: "Администратор",
  sales: "Менеджер по продажам", chef: "Шеф-повар",
};

export function ManagerTimesheet({ initial, initialMonth }: { initial: TimeEntry[]; initialMonth: string }) {
  const { toast } = useToast();
  const [month, setMonth] = useState(new Date(initialMonth + "-01"));
  const [entries, setEntries] = useState<TimeEntry[]>(initial);
  const [loading, setLoading] = useState(false);
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [editHours, setEditHours] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function loadMonth(m: Date) {
    setLoading(true);
    try {
      const res = await fetch(`/api/time-entries?month=${format(m, "yyyy-MM")}`);
      if (res.ok) setEntries(await res.json());
      else toast({ title: "Не удалось загрузить табель", variant: "destructive" });
    } catch {
      toast({ title: "Ошибка сети", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  function prevMonth() { const m = subMonths(month, 1); setMonth(m); loadMonth(m); }
  function nextMonth() { const m = addMonths(month, 1); setMonth(m); loadMonth(m); }

  function openEdit(entry: TimeEntry) {
    const start = resolveHHMM(entry.start_time, entry.checked_in_at);
    const end = resolveHHMM(entry.end_time, entry.checked_out_at);
    setEditTarget({
      entryId: entry.id,
      employeeName: entry.employee.full_name,
      day: parseInt(new Date(entry.work_date).toISOString().slice(8, 10), 10),
      start_time: start,
      end_time: end,
    });
    setEditHours(String(calcMinsFromEntry(entry) / 60));
  }

  function openEditById(entryId: string) {
    const entry = entries.find((e) => e.id === entryId);
    if (entry) openEdit(entry);
  }

  async function saveEdit() {
    if (!editTarget) return;
    const hours = parseFloat(editHours);
    if (isNaN(hours) || hours <= 0) {
      toast({ title: "Укажите корректное количество часов", variant: "destructive" });
      return;
    }
    const [sh, sm] = (editTarget.start_time ?? "00:00").split(":").map(Number);
    const endTotal = sh * 60 + sm + Math.round(hours * 60);
    const newEnd = `${String(Math.floor(endTotal / 60)).padStart(2, "0")}:${String(endTotal % 60).padStart(2, "0")}`;
    setSaving(true);
    const res = await fetch(`/api/time-entries/${editTarget.entryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ start_time: editTarget.start_time, end_time: newEnd }),
    });
    setSaving(false);
    if (res.ok) {
      toast({ title: "Время обновлено", variant: "success" });
      setEditTarget(null);
      await loadMonth(month);
    } else {
      const err = await res.json().catch(() => ({}));
      toast({ title: "Ошибка", description: err.error, variant: "destructive" });
    }
  }

  async function deleteEntry() {
    if (!editTarget) return;
    setDeleting(true);
    const res = await fetch(`/api/time-entries/${editTarget.entryId}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) {
      setEntries((prev) => prev.filter((e) => e.id !== editTarget.entryId));
      toast({ title: "Запись удалена", variant: "success" });
      setEditTarget(null);
    } else {
      toast({ title: "Ошибка удаления", variant: "destructive" });
    }
  }

  const activeDays = Array.from({ length: getDaysInMonth(month) }, (_, i) => i + 1);

  const employeeMap = new Map<string, EmpRow>();
  for (const entry of entries) {
    if (!employeeMap.has(entry.employee_id)) {
      employeeMap.set(entry.employee_id, { name: entry.employee.full_name, role: entry.employee.role, days: {}, totalMins: 0 });
    }
    const row = employeeMap.get(entry.employee_id)!;
    const day = parseInt(new Date(entry.work_date).toISOString().slice(8, 10), 10);
    const mins = calcMinsFromEntry(entry);
    const startTime = resolveHHMM(entry.start_time, entry.checked_in_at);
    const endTime = resolveHHMM(entry.end_time, entry.checked_out_at);
    row.days[day] = { mins, entryId: entry.id, startTime, endTime };
    row.totalMins += mins;
  }

  const employees = Array.from(employeeMap.entries()).sort((a, b) => a[1].name.localeCompare(b[1].name, "ru"));

  const dayTotals: Record<number, number> = {};
  for (const [, emp] of employees) {
    for (const [d, cell] of Object.entries(emp.days)) {
      dayTotals[Number(d)] = (dayTotals[Number(d)] ?? 0) + cell.mins;
    }
  }
  const grandTotal = Object.values(dayTotals).reduce((s, v) => s + v, 0);

  return (
    <div className="space-y-4">
      {/* Month nav */}
      <div className="flex items-center gap-2">
        <button onClick={prevMonth}
          className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors min-h-0 min-w-0 h-auto w-auto">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="font-display font-bold capitalize min-w-[160px] text-center">
          {format(month, "LLLL yyyy", { locale: ru })}
        </span>
        <button onClick={nextMonth}
          className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors min-h-0 min-w-0 h-auto w-auto">
          <ChevronRight className="h-5 w-5" />
        </button>
        {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>

      {/* Mobile */}
      <div className="md:hidden">
        <MobileTimesheetView employees={employees} month={month} onEdit={openEditById} />
      </div>

      {/* Desktop table */}
      {employees.length === 0 ? (
        <p className="hidden md:block text-muted-foreground text-sm py-10 text-center">Нет отметок за этот месяц</p>
      ) : (
        <div className="hidden md:block overflow-x-auto rounded-3xl mq-hair">
          <table className="min-w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid hsl(var(--border))" }}>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium whitespace-nowrap sticky left-0 z-10 min-w-[180px]"
                  style={{ background: "hsl(var(--card))" }}>
                  Сотрудник
                </th>
                {activeDays.map((day) => (
                  <th key={day} className="px-2 py-3 text-muted-foreground font-medium text-center whitespace-nowrap min-w-[52px]">
                    {day}
                  </th>
                ))}
                <th className="px-4 py-3 font-semibold text-center whitespace-nowrap sticky right-0 z-10"
                  style={{ background: "hsl(var(--card))", borderLeft: "1px solid hsl(var(--border))" }}>
                  Итого
                </th>
              </tr>
            </thead>
            <tbody>
              {employees.map(([, emp]) => (
                <tr key={emp.name} className="group/row transition-colors"
                  style={{ borderBottom: "1px solid hsl(var(--border))" }}>
                  <td className="px-4 py-3 sticky left-0 z-10 transition-colors"
                    style={{ background: "hsl(var(--card))" }}>
                    <p className="font-display font-semibold whitespace-nowrap">{emp.name}</p>
                    <p className="text-muted-foreground text-xs">{ROLE_LABELS[emp.role] ?? emp.role}</p>
                  </td>
                  {activeDays.map((day) => {
                    const cell = emp.days[day];
                    return (
                      <td key={day} className="px-2 py-3 text-center">
                        {cell ? (
                          <button
                            onClick={() => openEditById(cell.entryId)}
                            className="font-display font-bold hover:underline transition-colors min-h-0 min-w-0 h-auto w-auto tabular-nums flex flex-col items-center gap-0.5"
                            style={{ color: "hsl(var(--primary))" }}
                          >
                            {fmtHours(cell.mins)}
                            {cell.startTime && cell.endTime && (
                              <span className="text-[10px] font-normal tabular-nums" style={{ color: "hsl(var(--muted-foreground))" }}>
                                {cell.startTime.slice(0, 5)}–{cell.endTime.slice(0, 5)}
                              </span>
                            )}
                          </button>
                        ) : (
                          <span className="text-muted-foreground opacity-30">—</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-center sticky right-0 z-10 transition-colors"
                    style={{ background: "hsl(var(--card))", borderLeft: "1px solid hsl(var(--border))" }}>
                    <span className="font-display font-bold">{fmtHours(emp.totalMins) || "—"}</span>
                  </td>
                </tr>
              ))}
              <tr style={{ borderTop: "2px solid hsl(var(--border))", background: "hsl(var(--muted))" }}>
                <td className="px-4 py-2.5 sticky left-0 z-10" style={{ background: "hsl(var(--muted))" }}>
                  <p className="text-muted-foreground font-medium text-xs uppercase tracking-wider">Итого часов</p>
                </td>
                {activeDays.map((day) => (
                  <td key={day} className="px-2 py-2.5 text-center">
                    <span className="text-muted-foreground text-xs font-medium tabular-nums">{fmtHours(dayTotals[day]) || "—"}</span>
                  </td>
                ))}
                <td className="px-4 py-2.5 text-center sticky right-0 z-10"
                  style={{ background: "hsl(var(--muted))", borderLeft: "1px solid hsl(var(--border))" }}>
                  <span className="font-display font-bold">{fmtHours(grandTotal) || "—"}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editTarget} onOpenChange={(open) => { if (!open) setEditTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display font-bold">Редактировать запись</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {editTarget.employeeName} · {editTarget.day} {format(month, "LLLL", { locale: ru })}
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="edit-hours">Часов отработано</Label>
                <Input
                  id="edit-hours" type="number" min="1" max="24" step="1"
                  value={editHours} onChange={(e) => setEditHours(e.target.value)}
                  className="rounded-2xl"
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="ghost" size="sm" onClick={deleteEntry} disabled={deleting || saving}
              className="text-destructive hover:text-destructive mr-auto rounded-xl">
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
            <Button variant="outline" className="rounded-xl" onClick={() => setEditTarget(null)}>Отмена</Button>
            <Button className="rounded-xl" onClick={saveEdit} disabled={saving || deleting}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
