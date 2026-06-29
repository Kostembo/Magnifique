"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CSSProperties } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, MoreHorizontal, Pencil, KeyRound, Loader2, User, CalendarPlus } from "lucide-react";
import { ROLE_LABELS, TIER_LABELS, formatPhone } from "@/lib/utils";
import { EmployeeMobileCard } from "./employee-mobile-card";
import { InviteToEventDialog } from "./invite-to-event-dialog";
import { motion } from "framer-motion";
import { stagger } from "@/lib/motion";

type Employee = {
  id: string;
  full_name: string;
  phone: string;
  role: string;
  tier: string;
  created_at?: Date;
  photo_url?: string | null;
};

const TIER_CHIP: Record<string, CSSProperties> = {
  core:    { background: "hsl(270 50% 18%)", color: "hsl(270 65% 72%)" },
  regular: { background: "hsl(30 50% 16%)",  color: "hsl(30 70% 62%)" },
  trainee: { background: "hsl(143 55% 18%)", color: "hsl(143 60% 68%)" },
};

interface Props { initialEmployees: Employee[] }

export function EmployeesClient({ initialEmployees }: Props) {
  const router = useRouter();
  const { toast } = useToast();

  const [employees] = useState(initialEmployees);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");
  const [resetTarget, setResetTarget] = useState<Employee | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetting, setResetting] = useState(false);
  const [inviteTarget, setInviteTarget] = useState<Employee | null>(null);

  const filtered = useMemo(() => {
    return employees.filter((e) => {
      if (roleFilter !== "all" && e.role !== roleFilter) return false;
      if (tierFilter !== "all" && e.tier !== tierFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!e.full_name.toLowerCase().includes(q) && !e.phone.includes(q)) return false;
      }
      return true;
    });
  }, [employees, search, roleFilter, tierFilter]);

  async function resetPassword() {
    if (!resetTarget || newPassword.length < 6) return;
    setResetting(true);
    try {
      const res = await fetch(`/api/employees/${resetTarget.id}/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_password: newPassword }),
      });
      if (res.ok) {
        toast({ title: "Пароль сброшен", variant: "success" });
        setResetTarget(null);
        setNewPassword("");
      } else {
        const data = await res.json().catch(() => ({}));
        toast({ title: "Ошибка", description: data.error ?? "Не удалось сбросить пароль", variant: "destructive" });
      }
    } catch {
      toast({ title: "Ошибка", description: "Нет соединения с сервером", variant: "destructive" });
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="px-4 pb-28 pt-4 md:px-6 md:pb-6 space-y-5 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-[28px] font-extrabold tracking-[-0.03em]">Сотрудники</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">{employees.length} сотрудников</p>
        </div>
        <Button asChild className="rounded-xl gap-2">
          <Link href="/employees/new">
            <Plus className="h-4 w-4" />Добавить
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2.5">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по имени или телефону..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-2xl"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[140px] rounded-2xl">
            <SelectValue placeholder="Роль" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все роли</SelectItem>
            {Object.entries(ROLE_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={tierFilter} onValueChange={setTierFilter}>
          <SelectTrigger className="w-[140px] rounded-2xl">
            <SelectValue placeholder="Уровень" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все уровни</SelectItem>
            {Object.entries(TIER_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block rounded-3xl overflow-hidden mq-hair">
        <Table>
          <TableHeader>
            <TableRow style={{ background: "hsl(var(--card))" }}>
              <TableHead>ФИО</TableHead>
              <TableHead>Телефон</TableHead>
              <TableHead>Роль</TableHead>
              <TableHead>Уровень</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                  Нет сотрудников по заданным фильтрам
                </TableCell>
              </TableRow>
            )}
            {filtered.map((emp) => (
              <TableRow key={emp.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-muted border border-border overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {emp.photo_url
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={emp.photo_url} alt="" className="w-full h-full object-cover" />
                        : <User className="h-5 w-5 text-muted-foreground" />}
                    </div>
                    <span className="font-display font-semibold">{emp.full_name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground tabular-nums">{formatPhone(emp.phone)}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center px-3 py-1 rounded-xl bg-muted text-[13px] font-medium text-foreground">
                    {ROLE_LABELS[emp.role] ?? emp.role}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center px-3 py-1 rounded-xl text-[13px] font-medium"
                    style={TIER_CHIP[emp.tier] ?? TIER_CHIP.regular}>
                    {TIER_LABELS[emp.tier] ?? emp.tier}
                  </span>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-xl" aria-label="Действия">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/employees/${emp.id}/edit`)}>
                        <Pencil className="h-4 w-4 mr-2" /> Редактировать
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setResetTarget(emp); setNewPassword(""); }}>
                        <KeyRound className="h-4 w-4 mr-2" /> Сбросить пароль
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setInviteTarget(emp)}>
                        <CalendarPlus className="h-4 w-4 mr-2" /> Пригласить на мероприятие
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <motion.div variants={stagger} initial="hidden" animate="show" className="md:hidden space-y-2.5">
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-12">Нет сотрудников по заданным фильтрам</p>
        )}
        {filtered.map((emp, i) => (
          <EmployeeMobileCard
            key={emp.id}
            emp={emp}
            index={i}
            onEdit={(id) => router.push(`/employees/${id}/edit`)}
            onResetPassword={(e) => { setResetTarget(e); setNewPassword(""); }}
            onInvite={(e) => setInviteTarget(e)}
          />
        ))}
      </motion.div>

      <InviteToEventDialog employee={inviteTarget} onClose={() => setInviteTarget(null)} />

      {/* Диалог сброса пароля */}
      <Dialog open={!!resetTarget} onOpenChange={(open) => { if (!open) { setResetTarget(null); setNewPassword(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display font-bold">Сброс пароля</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Сотрудник: <span className="font-medium text-foreground">{resetTarget?.full_name}</span>
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="reset-password">Новый пароль</Label>
            <Input
              id="reset-password"
              type="password"
              placeholder="Минимум 6 символов"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="rounded-2xl"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setResetTarget(null)}>Отмена</Button>
            <Button className="rounded-xl" onClick={resetPassword} disabled={resetting || newPassword.length < 6}>
              {resetting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
