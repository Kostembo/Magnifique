"use client";

import { useState } from "react";
import { format, getDaysInMonth, startOfMonth, addMonths, subMonths } from "date-fns";
import { ru } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface TimeEntry {
  id: string;
  employee_id: string;
  work_date: string;
  start_time: string;
  end_time: string;
  employee: { id: string; full_name: string; role: string };
}

function calcMins(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return Math.max(0, (eh * 60 + em) - (sh * 60 + sm));
}

function fmtHours(mins: number): string {
  if (!mins) return "";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}ч${m}м` : `${h}ч`;
}

const ROLE_LABELS: Record<string, string> = {
  waiter: "Официант", cook: "Повар", warehouse: "Склад", manager: "Менеджер",
};

export function ManagerTimesheet({ initial, initialMonth }: { initial: TimeEntry[]; initialMonth: string }) {
  const [month, setMonth] = useState(new Date(initialMonth + "-01"));
  const [entries, setEntries] = useState<TimeEntry[]>(initial);
  const [loading, setLoading] = useState(false);

  async function loadMonth(m: Date) {
    setLoading(true);
    const key = format(m, "yyyy-MM");
    const res = await fetch(`/api/time-entries?month=${key}`);
    if (res.ok) setEntries(await res.json());
    setLoading(false);
  }

  function prevMonth() { const m = subMonths(month, 1); setMonth(m); loadMonth(m); }
  function nextMonth() { const m = addMonths(month, 1); setMonth(m); loadMonth(m); }

  // Build days array for this month that have at least one entry
  const daysInMonth = getDaysInMonth(month);
  const activeDays = Array.from(
    new Set(entries.map((e) => new Date(e.work_date).getDate()))
  ).sort((a, b) => a - b);

  // Group entries by employee
  const employeeMap = new Map<string, { name: string; role: string; days: Record<number, number> }>();
  for (const entry of entries) {
    if (!employeeMap.has(entry.employee_id)) {
      employeeMap.set(entry.employee_id, { name: entry.employee.full_name, role: entry.employee.role, days: {} });
    }
    const day = new Date(entry.work_date).getDate();
    const mins = calcMins(entry.start_time, entry.end_time);
    const emp = employeeMap.get(entry.employee_id)!;
    emp.days[day] = (emp.days[day] ?? 0) + mins;
  }

  const employees = Array.from(employeeMap.entries()).sort((a, b) => a[1].name.localeCompare(b[1].name, "ru"));

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center gap-3">
        <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-zinc-100 font-medium capitalize min-w-[160px] text-center">
          {format(month, "LLLL yyyy", { locale: ru })}
        </span>
        <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors">
          <ChevronRight className="h-5 w-5" />
        </button>
        {loading && <span className="text-xs text-zinc-500">Загрузка...</span>}
      </div>

      {employees.length === 0 ? (
        <p className="text-zinc-500 text-sm py-8 text-center">Нет отметок за этот месяц</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left px-4 py-3 text-zinc-400 font-medium whitespace-nowrap sticky left-0 bg-zinc-950 z-10">
                  Сотрудник
                </th>
                {activeDays.map((day) => (
                  <th key={day} className="px-3 py-3 text-zinc-400 font-medium text-center whitespace-nowrap min-w-[56px]">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.map(([id, emp]) => (
                <tr key={id} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-900/50 transition-colors">
                  <td className="px-4 py-3 sticky left-0 bg-zinc-950 z-10">
                    <p className="text-zinc-100 whitespace-nowrap">{emp.name}</p>
                    <p className="text-zinc-500 text-xs">{ROLE_LABELS[emp.role] ?? emp.role}</p>
                  </td>
                  {activeDays.map((day) => {
                    const mins = emp.days[day] ?? 0;
                    return (
                      <td key={day} className="px-3 py-3 text-center">
                        {mins > 0 ? (
                          <span className="text-[hsl(38,72%,62%)] font-medium">{fmtHours(mins)}</span>
                        ) : (
                          <span className="text-zinc-700">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
