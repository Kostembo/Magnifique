"use client";

import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Pencil } from "lucide-react";

export type DayEntry = { mins: number; entryId: string; startTime: string | null; endTime: string | null };
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
    return <p className="text-muted-foreground text-sm py-10 text-center">Нет отметок за этот месяц</p>;
  }

  return (
    <div className="space-y-2.5">
      {employees.map(([empId, emp]) => {
        const sortedDays = Object.entries(emp.days)
          .map(([day, entry]) => ({ day: Number(day), ...entry }))
          .sort((a, b) => a.day - b.day);

        return (
          <div key={empId} className="rounded-3xl mq-hair overflow-hidden" style={{ background: "hsl(var(--card))" }}>
            <div className="flex items-center justify-between px-4 py-3.5" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
              <div>
                <p className="font-display font-bold text-[15px]">{emp.name}</p>
                <p className="text-[12px] text-muted-foreground mt-0.5">{ROLE_LABELS[emp.role] ?? emp.role}</p>
              </div>
              <div className="text-right">
                <p className="text-[14px] font-display font-bold" style={{ color: "hsl(var(--primary))" }}>{fmtH(emp.totalMins)}</p>
                <p className="text-[11px] text-muted-foreground">за месяц</p>
              </div>
            </div>

            {sortedDays.length === 0 ? (
              <p className="px-4 py-3 text-[13px] text-muted-foreground">Нет записей</p>
            ) : (
              <div>
                {sortedDays.map(({ day, entryId, startTime, endTime, mins }) => (
                  <div key={day} className="flex items-center justify-between px-4 py-3"
                    style={{ borderBottom: "1px solid hsl(var(--border))" }}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-foreground text-[13px] font-display font-bold w-5 shrink-0">{day}</span>
                      <span className="text-muted-foreground text-[12px] shrink-0">
                        {format(month, "LLL", { locale: ru })}
                      </span>
                      <span className="text-foreground text-[13px]">
                        {startTime?.slice(0, 5) ?? "—"} — {endTime?.slice(0, 5) ?? "—"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[13px] font-display font-bold tabular-nums" style={{ color: "hsl(var(--primary))" }}>
                        {fmtH(mins)}
                      </span>
                      <button
                        onClick={() => onEdit(entryId)}
                        className="text-muted-foreground hover:text-foreground transition-colors p-1 min-h-0 min-w-0 h-auto w-auto"
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
