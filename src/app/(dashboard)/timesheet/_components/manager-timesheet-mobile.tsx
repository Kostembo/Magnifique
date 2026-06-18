"use client";

import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Pencil } from "lucide-react";

export type DayEntry = { mins: number; entryId: string; startTime: string; endTime: string };
export type EmpRow = { name: string; role: string; days: Record<number, DayEntry>; totalMins: number };

const ROLE_LABELS: Record<string, string> = {
  waiter: "Официант", cook: "Повар", warehouse: "Склад",
  manager: "Менеджер", owner: "Владелец", admin: "Администратор",
  sales: "Менеджер по продажам", chef: "Шеф-повар",
};

function fmtH(mins: number): string {
  if (!mins) return "0ч";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}ч ${m}м` : `${h}ч`;
}

interface Props {
  employees: [string, EmpRow][];
  month: Date;
  onEdit: (entryId: string) => void;
}

export function MobileTimesheetView({ employees, month, onEdit }: Props) {
  if (employees.length === 0) {
    return <p className="text-zinc-400 text-sm py-8 text-center">Нет отметок за этот месяц</p>;
  }

  return (
    <div className="space-y-3">
      {employees.map(([empId, emp]) => {
        const sortedDays = Object.entries(emp.days)
          .map(([day, entry]) => ({ day: Number(day), ...entry }))
          .sort((a, b) => a.day - b.day);

        return (
          <div key={empId} className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200">
              <div>
                <p className="font-medium text-zinc-900">{emp.name}</p>
                <p className="text-xs text-zinc-400 mt-0.5">{ROLE_LABELS[emp.role] ?? emp.role}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-[hsl(38,72%,42%)]">{fmtH(emp.totalMins)}</p>
                <p className="text-xs text-zinc-400">за месяц</p>
              </div>
            </div>

            {sortedDays.length === 0 ? (
              <p className="px-4 py-3 text-sm text-zinc-400">Нет записей</p>
            ) : (
              <div className="divide-y divide-zinc-200">
                {sortedDays.map(({ day, entryId, startTime, endTime, mins }) => (
                  <div key={day} className="flex items-center justify-between px-4 py-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-zinc-900 text-sm font-medium w-5 shrink-0">{day}</span>
                      <span className="text-zinc-400 text-xs shrink-0">
                        {format(month, "LLL", { locale: ru })}
                      </span>
                      <span className="text-zinc-600 text-sm">
                        {startTime.slice(0, 5)} — {endTime.slice(0, 5)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-medium text-[hsl(38,72%,42%)]">{fmtH(mins)}</span>
                      <button
                        onClick={() => onEdit(entryId)}
                        className="text-zinc-400 hover:text-zinc-700 transition-colors p-1"
                        aria-label="Редактировать"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
