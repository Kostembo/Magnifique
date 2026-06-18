"use client";

import { useState } from "react";
import { format, addMonths, subMonths, getDaysInMonth } from "date-fns";
import { ru } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Pencil, Trash2, Loader2 } from "lucide-react";
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
  start_time: string;
  end_time: string;
  employee: { id: string; full_name: string; role: string };
}

interface EditTarget {
  entryId: string;
  employeeName: string;
  day: number;
  start_time: string;
  end_time: string;
}

function calcMins(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return Math.max(0, (eh * 60 + em) - (sh * 60 + sm));
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
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
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
    setEditTarget({
      entryId: entry.id,
      employeeName: entry.employee.full_name,
      day: parseInt(entry.work_date.slice(8, 10), 10),
      start_time: entry.start_time,
      end_time: entry.end_time,
    });
    setEditStart(entry.start_time);
    setEditEnd(entry.end_time);
  }

  function openEditById(entryId: string) {
    const entry = entries.find((e) => e.id === entryId);
    if (entry) openEdit(entry);
  }

  async function saveEdit() {
    if (!editTarget) return;
    setSaving(true);
    const res = await fetch(`/api/time-entries/${editTarget.entryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ start_time: editStart, end_time: editEnd }),
    });
    setSaving(false);
    if (res.ok) {
      const updated: TimeEntry = await res.json();
      setEntries((prev) => prev.map((e) => e.id === updated.id ? updated : e));
      toast({ title: "Время обновлено", variant: "success" });
      setEditTarget(null);
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
    const day = parseInt(entry.work_date.slice(8, 10), 10);
    const mins = calcMins(entry.start_time, entry.end_time);
    row.days[day] = { mins, entryId: entry.id, startTime: entry.start_time, endTime: entry.end_time };
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
      <div className="flex items-center gap-3">
        <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-zinc-900 font-medium capitalize min-w-[160px] text-center">
          {format(month, "LLLL yyyy", { locale: ru })}
        </span>
        <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition-colors">
          <ChevronRight className="h-5 w-5" />
        </button>
        {loading && <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />}
      </div>

      {/* Mobile */}
      <div className="md:hidden">
        <MobileTimesheetView employees={employees} month={month} onEdit={openEditById} />
      </div>

      {/* Desktop table */}
      {employees.length === 0 ? (
        <p className="hidden md:block text-zinc-400 text-sm py-8 text-center">Нет отметок за этот месяц</p>
      ) : (
        <div className="hidden md:block overflow-x-auto rounded-xl border border-zinc-200">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200">
                <th className="text-left px-4 py-3 text-zinc-500 font-medium whitespace-nowrap sticky left-0 bg-white z-10 min-w-[180px]">
                  Сотрудник
                </th>
                {activeDays.map((day) => (
                  <th key={day} className="px-2 py-3 text-zinc-500 font-medium text-center whitespace-nowrap min-w-[52px]">
                    {day}
                  </th>
                ))}
                <th className="px-4 py-3 text-zinc-700 font-semibold text-center whitespace-nowrap sticky right-0 bg-white z-10 border-l border-zinc-200">
                  Итого
                </th>
              </tr>
            </thead>
            <tbody>
              {employees.map(([, emp]) => (
                <tr key={emp.name} className="group/row border-b border-zinc-200 last:border-0 hover:bg-zinc-50 transition-colors">
                  <td className="px-4 py-3 sticky left-0 bg-white group-hover/row:bg-zinc-50 z-10 transition-colors">
                    <p className="text-zinc-900 whitespace-nowrap">{emp.name}</p>
                    <p className="text-zinc-400 text-xs">{ROLE_LABELS[emp.role] ?? emp.role}</p>
                  </td>
                  {activeDays.map((day) => {
                    const cell = emp.days[day];
                    return (
                      <td key={day} className="px-2 py-3 text-center">
                        {cell ? (
                          <button
                            onClick={() => openEditById(cell.entryId)}
                            className="group inline-flex items-center gap-1 text-[hsl(38,72%,42%)] font-medium hover:text-[hsl(38,72%,32%)] transition-colors"
                          >
                            {fmtHours(cell.mins)}
                            <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity" />
                          </button>
                        ) : (
                          <span className="text-zinc-300">—</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-center sticky right-0 bg-white group-hover/row:bg-zinc-50 z-10 border-l border-zinc-200 transition-colors">
                    <span className="font-semibold text-zinc-900">{fmtHours(emp.totalMins) || "—"}</span>
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-zinc-200 bg-zinc-50">
                <td className="px-4 py-2.5 sticky left-0 bg-zinc-50 z-10">
                  <p className="text-zinc-500 font-medium text-xs uppercase tracking-wide">Итого часов</p>
                </td>
                {activeDays.map((day) => (
                  <td key={day} className="px-2 py-2.5 text-center">
                    <span className="text-zinc-600 text-xs font-medium">{fmtHours(dayTotals[day]) || "—"}</span>
                  </td>
                ))}
                <td className="px-4 py-2.5 text-center sticky right-0 bg-zinc-50 z-10 border-l border-zinc-200">
                  <span className="font-bold text-zinc-900">{fmtHours(grandTotal) || "—"}</span>
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
            <DialogTitle>Редактировать запись</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {editTarget.employeeName} · {editTarget.day} {format(month, "LLLL", { locale: ru })}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-start">Начало</Label>
                  <Input id="edit-start" type="time" value={editStart} onChange={(e) => setEditStart(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-end">Конец</Label>
                  <Input id="edit-end" type="time" value={editEnd} onChange={(e) => setEditEnd(e.target.value)} />
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="ghost" size="sm" onClick={deleteEntry} disabled={deleting || saving} className="text-destructive hover:text-destructive mr-auto">
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
            <Button variant="outline" onClick={() => setEditTarget(null)}>Отмена</Button>
            <Button onClick={saveEdit} disabled={saving || deleting}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
