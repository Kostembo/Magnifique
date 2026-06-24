"use client";

import { useState } from "react";
import { format, addMonths, subMonths } from "date-fns";
import { ru } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Loader2, Check, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ROLE_LABELS } from "@/lib/utils";
import type { PayrollEntry } from "../page";

const PAY_STATUS_LABEL: Record<string, string> = {
  draft: "Не подтверждено",
  confirmed: "Подтверждено",
  paid: "Выплачено",
};

const PAY_STATUS_VARIANT: Record<string, "secondary" | "warning" | "success"> = {
  draft: "secondary",
  confirmed: "warning",
  paid: "success",
};

interface EmployeeGroup {
  employee: PayrollEntry["employee"];
  entries: PayrollEntry[];
  totalPay: number;
}

function groupByEmployee(entries: PayrollEntry[]): EmployeeGroup[] {
  const map = new Map<string, EmployeeGroup>();
  for (const e of entries) {
    if (!map.has(e.employee_id)) {
      map.set(e.employee_id, { employee: e.employee, entries: [], totalPay: 0 });
    }
    const g = map.get(e.employee_id)!;
    g.entries.push(e);
    g.totalPay += e.calculated_pay ? Number(e.calculated_pay) : 0;
  }
  return Array.from(map.values()).sort((a, b) => a.employee.full_name.localeCompare(b.employee.full_name, "ru"));
}

export function PayrollList({ initial, initialMonth }: { initial: PayrollEntry[]; initialMonth: string }) {
  const { toast } = useToast();
  const [month, setMonth] = useState(new Date(initialMonth + "-01"));
  const [entries, setEntries] = useState<PayrollEntry[]>(initial);
  const [loading, setLoading] = useState(false);
  const [payComment, setPayComment] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<string | null>(null);

  async function loadMonth(m: Date) {
    setLoading(true);
    try {
      const res = await fetch(`/api/payroll?month=${format(m, "yyyy-MM")}`);
      if (res.ok) setEntries(await res.json());
      else toast({ title: "Не удалось загрузить данные", variant: "destructive" });
    } catch {
      toast({ title: "Ошибка сети", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  function prevMonth() { const m = subMonths(month, 1); setMonth(m); loadMonth(m); }
  function nextMonth() { const m = addMonths(month, 1); setMonth(m); loadMonth(m); }

  async function updatePayStatus(entryId: string, pay_status: "confirmed" | "paid") {
    setProcessing(entryId);
    try {
      const body: Record<string, string> = { pay_status };
      if (pay_status === "paid" && payComment[entryId]) body.pay_comment = payComment[entryId];
      const res = await fetch(`/api/time-entries/${entryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setEntries((prev) => prev.map((e) => e.id === entryId ? { ...e, pay_status, pay_comment: body.pay_comment ?? e.pay_comment } : e));
        toast({ title: pay_status === "confirmed" ? "Подтверждено" : "Отмечено как выплачено", variant: "success" });
      } else {
        const err = await res.json().catch(() => ({}));
        toast({ title: "Ошибка", description: err.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Ошибка сети", variant: "destructive" });
    } finally {
      setProcessing(null);
    }
  }

  const groups = groupByEmployee(entries);

  return (
    <div className="space-y-4">
      {/* Month nav */}
      <div className="flex items-center gap-2">
        <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors min-h-0 min-w-0 h-auto w-auto">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="font-display font-bold capitalize min-w-[160px] text-center">
          {format(month, "LLLL yyyy", { locale: ru })}
        </span>
        <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors min-h-0 min-w-0 h-auto w-auto">
          <ChevronRight className="h-5 w-5" />
        </button>
        {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>

      {groups.length === 0 && (
        <p className="text-muted-foreground text-sm py-10 text-center">Нет данных за этот месяц</p>
      )}

      {groups.map(({ employee, entries: empEntries, totalPay }) => {
        const allPaid = empEntries.every((e) => e.pay_status === "paid");
        const anyConfirmed = empEntries.some((e) => e.pay_status === "confirmed");
        return (
          <div key={employee.id} className="rounded-3xl mq-hair p-4 space-y-3" style={{ background: "hsl(var(--card))" }}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-display font-bold text-[15px]">{employee.full_name}</p>
                <p className="text-xs text-muted-foreground">{ROLE_LABELS[employee.role] ?? employee.role}</p>
              </div>
              <div className="text-right">
                <p className="font-display font-bold text-[17px]">{Math.round(totalPay).toLocaleString("ru")} ₽</p>
                {allPaid && <p className="text-xs" style={{ color: "hsl(var(--ok))" }}>Выплачено</p>}
                {!allPaid && anyConfirmed && <p className="text-xs" style={{ color: "hsl(var(--warn))" }}>Ожидает выплаты</p>}
              </div>
            </div>

            <div className="space-y-2 pt-1" style={{ borderTop: "1px solid hsl(var(--border))" }}>
              {empEntries.map((entry) => {
                const hours = entry.calculated_hours ? Number(entry.calculated_hours) : null;
                const pay = entry.calculated_pay ? Number(entry.calculated_pay) : null;
                const isProcessing = processing === entry.id;
                return (
                  <div key={entry.id} className="space-y-1.5">
                    <div className="flex items-center gap-2 text-[13px]">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{entry.event.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(entry.event.starts_at), "d MMM", { locale: ru })}
                          {hours != null && ` · ${hours.toFixed(1)} ч`}
                          {pay != null && ` · ${Math.round(pay).toLocaleString("ru")} ₽`}
                        </p>
                      </div>
                      <Badge variant={PAY_STATUS_VARIANT[entry.pay_status] ?? "secondary"} className="shrink-0 text-xs">
                        {PAY_STATUS_LABEL[entry.pay_status]}
                      </Badge>
                    </div>

                    {entry.pay_status === "draft" && (
                      <Button size="sm" variant="outline" className="w-full rounded-xl h-8 text-xs gap-1.5" onClick={() => updatePayStatus(entry.id, "confirmed")} disabled={isProcessing}>
                        {isProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                        Подтвердить
                      </Button>
                    )}

                    {entry.pay_status === "confirmed" && (
                      <div className="space-y-1.5">
                        <input
                          type="text"
                          placeholder="Комментарий (необязательно)"
                          value={payComment[entry.id] ?? ""}
                          onChange={(e) => setPayComment((prev) => ({ ...prev, [entry.id]: e.target.value }))}
                          className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        <Button size="sm" className="w-full rounded-xl h-8 text-xs gap-1.5" onClick={() => updatePayStatus(entry.id, "paid")} disabled={isProcessing}>
                          {isProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Banknote className="h-3.5 w-3.5" />}
                          Выплачено
                        </Button>
                      </div>
                    )}

                    {entry.pay_status === "paid" && entry.pay_comment && (
                      <p className="text-xs text-muted-foreground pl-1">{entry.pay_comment}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
