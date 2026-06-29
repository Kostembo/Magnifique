"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Loader2, LogOut, UserPlus, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ROLE_LABELS } from "@/lib/utils";

type ActiveEmp = { employee_id: string; full_name: string; role: string; checked_in_at: string; start_time: string | null };
type IdleEmp   = { employee_id: string; full_name: string; role: string };

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const pad2 = (n: number) => String(n).padStart(2, "0");

export function ActiveShiftTab({ eventId }: { eventId: string }) {
  const { toast } = useToast();
  const [active, setActive]     = useState<ActiveEmp[]>([]);
  const [idle, setIdle]         = useState<IdleEmp[]>([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [confirmOne, setConfirmOne] = useState<ActiveEmp | null>(null);
  const [confirmAll, setConfirmAll] = useState(false);
  const [addOpen, setAddOpen]   = useState(false);
  const [addEmpId, setAddEmpId] = useState("");
  const [addHour, setAddHour]   = useState(9);

  const load = useCallback(async () => {
    const res = await fetch(`/api/events/${eventId}/active-checkins`);
    if (res.ok) {
      const data = await res.json();
      setActive(data.checked_in ?? []);
      setIdle(data.not_checked_in ?? []);
    }
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, [load]);

  async function doCheckout(employeeId?: string) {
    setSaving(true);
    try {
      const body = employeeId
        ? { action: "checkout", employee_id: employeeId }
        : { action: "checkout_all" };
      const res = await fetch(`/api/events/${eventId}/manager-checkout`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast({ title: employeeId ? "Смена завершена" : "Все смены завершены", variant: "success" });
        setConfirmOne(null);
        setConfirmAll(false);
        load();
      } else {
        const err = await res.json().catch(() => ({}));
        toast({ title: "Ошибка", description: err.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Ошибка", description: "Нет соединения", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function doAdd() {
    if (!addEmpId) return;
    setSaving(true);
    const res = await fetch(`/api/events/${eventId}/manager-checkout`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "checkin", employee_id: addEmpId, start_time: `${pad2(addHour)}:00` }),
    });
    setSaving(false);
    if (res.ok) {
      toast({ title: "Добавлен на смену", variant: "success" });
      setAddOpen(false);
      setAddEmpId("");
      setAddHour(9);
      load();
    } else {
      const err = await res.json().catch(() => ({}));
      toast({ title: "Ошибка", description: err.error, variant: "destructive" });
    }
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  const showTime = (emp: ActiveEmp) =>
    emp.start_time ?? format(new Date(emp.checked_in_at), "HH:mm", { locale: ru });

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {active.length === 0 ? "Никто ещё не отметился" : `На смене: ${active.length}`}
        </p>
        <div className="flex items-center gap-2">
          {idle.length > 0 && (
            <Button size="sm" variant="outline" className="rounded-xl gap-1.5" onClick={() => { setAddEmpId(""); setAddHour(9); setAddOpen(true); }}>
              <UserPlus className="h-4 w-4" />Добавить
            </Button>
          )}
          {active.length > 1 && (
            <Button size="sm" variant="outline" className="rounded-xl gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10"
              onClick={() => setConfirmAll(true)}>
              <LogOut className="h-4 w-4" />Завершить всем
            </Button>
          )}
        </div>
      </div>

      {/* List */}
      {active.length === 0 ? (
        <div className="rounded-3xl mq-hair py-10 text-center text-muted-foreground text-sm" style={{ background: "hsl(var(--card))" }}>
          <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
          Сотрудники ещё не отметились
        </div>
      ) : (
        <div className="rounded-3xl mq-hair overflow-hidden" style={{ background: "hsl(var(--card))" }}>
          {active.map((emp, i) => (
            <div key={emp.employee_id}
              className="flex items-center gap-3 px-4 py-3"
              style={{ borderTop: i > 0 ? "1px solid hsl(var(--border))" : undefined }}>
              <div className="flex-1 min-w-0">
                <p className="font-display font-semibold text-[14px] truncate">{emp.full_name}</p>
                <p className="text-[12px] text-muted-foreground">
                  {ROLE_LABELS[emp.role] ?? emp.role} · с {showTime(emp)}
                </p>
              </div>
              <Button size="sm" variant="ghost"
                className="rounded-xl gap-1.5 text-destructive hover:bg-destructive/10 shrink-0"
                onClick={() => setConfirmOne(emp)}>
                <LogOut className="h-4 w-4" />Завершить
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Confirm single */}
      <Dialog open={!!confirmOne} onOpenChange={(o) => { if (!o) setConfirmOne(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display font-bold">Завершить смену</DialogTitle></DialogHeader>
          {confirmOne && (
            <p className="text-sm text-muted-foreground">
              {confirmOne.full_name} · завершение в {format(new Date(), "HH:mm", { locale: ru })}
            </p>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setConfirmOne(null)}>Отмена</Button>
            <Button className="rounded-xl" onClick={() => doCheckout(confirmOne?.employee_id)} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Подтвердить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm all */}
      <Dialog open={confirmAll} onOpenChange={setConfirmAll}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display font-bold">Завершить всем</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Завершить смену {active.length} сотрудникам в {format(new Date(), "HH:mm", { locale: ru })}?</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setConfirmAll(false)}>Отмена</Button>
            <Button className="rounded-xl" onClick={() => doCheckout()} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Завершить всем
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add manual */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display font-bold">Добавить на смену</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Сотрудник</p>
              <select
                value={addEmpId}
                onChange={(e) => setAddEmpId(e.target.value)}
                className="w-full rounded-2xl border border-border bg-card px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">— выберите —</option>
                {idle.map((e) => (
                  <option key={e.employee_id} value={e.employee_id}>
                    {e.full_name} ({ROLE_LABELS[e.role] ?? e.role})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Начало смены</p>
              <select
                value={addHour}
                onChange={(e) => setAddHour(Number(e.target.value))}
                className="w-full rounded-2xl border border-border bg-card px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {HOURS.map((h) => <option key={h} value={h}>{pad2(h)}:00</option>)}
              </select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setAddOpen(false)}>Отмена</Button>
            <Button className="rounded-xl" onClick={doAdd} disabled={saving || !addEmpId}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Добавить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
