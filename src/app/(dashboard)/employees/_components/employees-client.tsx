"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Search, MoreHorizontal, Pencil, UserX, UserCheck, KeyRound, Loader2, User,
} from "lucide-react";
import { ROLE_LABELS, TIER_LABELS, formatPhone } from "@/lib/utils";
import { EmployeeMobileCard } from "./employee-mobile-card";

type Employee = {
  id: string;
  full_name: string;
  phone: string;
  role: string;
  tier: string;
  is_active: boolean;
  created_at?: Date;
  photo_url?: string | null;
};

const TIER_BADGE: Record<string, "success" | "info" | "warning"> = {
  core: "success",
  regular: "info",
  trainee: "warning",
};

interface Props {
  initialEmployees: Employee[];
}

export function EmployeesClient({ initialEmployees }: Props) {
  const router = useRouter();
  const { toast } = useToast();

  const [employees, setEmployees] = useState(initialEmployees);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");
  const [activeFilter, setActiveFilter] = useState("active");
  const [resetTarget, setResetTarget] = useState<Employee | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetting, setResetting] = useState(false);

  const filtered = useMemo(() => {
    return employees.filter((e) => {
      if (roleFilter !== "all" && e.role !== roleFilter) return false;
      if (tierFilter !== "all" && e.tier !== tierFilter) return false;
      if (activeFilter === "active" && !e.is_active) return false;
      if (activeFilter === "inactive" && e.is_active) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!e.full_name.toLowerCase().includes(q) && !e.phone.includes(q)) return false;
      }
      return true;
    });
  }, [employees, search, roleFilter, tierFilter, activeFilter]);

  async function toggleActive(id: string, current: boolean) {
    const res = await fetch(`/api/employees/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !current }),
    });
    if (res.ok) {
      setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, is_active: !current } : e)));
      toast({
        title: current ? "Сотрудник деактивирован" : "Сотрудник активирован",
        variant: current ? "default" : "success",
      });
    } else {
      toast({ title: "Ошибка", description: "Не удалось обновить статус", variant: "destructive" });
    }
  }

  async function resetPassword() {
    if (!resetTarget || newPassword.length < 6) return;
    setResetting(true);
    const res = await fetch(`/api/employees/${resetTarget.id}/password`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ new_password: newPassword }),
    });
    setResetting(false);
    if (res.ok) {
      toast({ title: "Пароль сброшен", variant: "success" });
      setResetTarget(null);
      setNewPassword("");
    } else {
      const data = await res.json();
      toast({ title: "Ошибка", description: data.error, variant: "destructive" });
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Сотрудники</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {employees.filter((e) => e.is_active).length} активных &middot; {employees.length} всего
          </p>
        </div>
        <Button asChild>
          <Link href="/employees/new">
            <Plus className="h-4 w-4 mr-2" />
            Добавить
          </Link>
          </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по имени или телефону..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[140px]">
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
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Уровень" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все уровни</SelectItem>
            {Object.entries(TIER_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={activeFilter} onValueChange={setActiveFilter}>
          <SelectTrigger className="w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value="active">Активные</SelectItem>
            <SelectItem value="inactive">Неактивные</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ФИО</TableHead>
              <TableHead>Телефон</TableHead>
              <TableHead>Роль</TableHead>
              <TableHead>Уровень</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                  Нет сотрудников по заданным фильтрам
                </TableCell>
              </TableRow>
            )}
            {filtered.map((emp) => (
              <TableRow key={emp.id} className={!emp.is_active ? "opacity-50" : ""}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {emp.photo_url
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={emp.photo_url} alt="" className="w-full h-full object-cover" />
                        : <User className="h-5 w-5 text-zinc-500" />}
                    </div>
                    {emp.full_name}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{formatPhone(emp.phone)}</TableCell>
                <TableCell>
                  <Badge variant="outline">{ROLE_LABELS[emp.role] ?? emp.role}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={TIER_BADGE[emp.tier] ?? "outline"}>
                    {TIER_LABELS[emp.tier] ?? emp.tier}
                  </Badge>
                </TableCell>
                <TableCell>
                  {emp.is_active
                    ? <Badge variant="success">Активен</Badge>
                    : <Badge variant="secondary">Неактивен</Badge>}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="Действия">
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
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => toggleActive(emp.id, emp.is_active)}>
                        {emp.is_active
                          ? <><UserX className="h-4 w-4 mr-2" /> Деактивировать</>
                          : <><UserCheck className="h-4 w-4 mr-2" /> Активировать</>}
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
      <div className="md:hidden space-y-3">
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-12">
            Нет сотрудников по заданным фильтрам
          </p>
        )}
        {filtered.map((emp, i) => (
          <EmployeeMobileCard
            key={emp.id}
            emp={emp}
            index={i}
            onEdit={(id) => router.push(`/employees/${id}/edit`)}
            onResetPassword={(e) => { setResetTarget(e); setNewPassword(""); }}
            onToggleActive={toggleActive}
          />
        ))}
      </div>

      {/* Диалог сброса пароля */}
      <Dialog open={!!resetTarget} onOpenChange={(open) => { if (!open) { setResetTarget(null); setNewPassword(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Сброс пароля</DialogTitle>
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
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetTarget(null)}>Отмена</Button>
            <Button onClick={resetPassword} disabled={resetting || newPassword.length < 6}>
              {resetting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
