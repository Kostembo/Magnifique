"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, UserX, UserCheck, KeyRound, User } from "lucide-react";
import { ROLE_LABELS, TIER_LABELS, formatPhone } from "@/lib/utils";

const TIER_BADGE: Record<string, "success" | "info" | "warning"> = {
  core: "success",
  regular: "info",
  trainee: "warning",
};

type Employee = {
  id: string;
  full_name: string;
  phone: string;
  role: string;
  tier: string;
  is_active: boolean;
  photo_url?: string | null;
};

interface Props {
  emp: Employee;
  index: number;
  onEdit: (id: string) => void;
  onResetPassword: (emp: Employee) => void;
  onToggleActive: (id: string, current: boolean) => void;
}

export function EmployeeMobileCard({ emp, index, onEdit, onResetPassword, onToggleActive }: Props) {
  return (
    <motion.div
      key={emp.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 24, delay: Math.min(index * 0.05, 0.3) }}
      className={`rounded-xl border p-4 space-y-2 ${!emp.is_active ? "opacity-60" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 overflow-hidden flex-shrink-0 flex items-center justify-center">
            {emp.photo_url
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={emp.photo_url} alt="" className="w-full h-full object-cover" />
              : <User className="h-5 w-5 text-zinc-500" />}
          </div>
          <div>
            <p className="font-medium">{emp.full_name}</p>
            <p className="text-sm text-muted-foreground">{formatPhone(emp.phone)}</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Действия">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(emp.id)}>
              <Pencil className="h-4 w-4 mr-2" /> Редактировать
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onResetPassword(emp)}>
              <KeyRound className="h-4 w-4 mr-2" /> Сбросить пароль
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onToggleActive(emp.id, emp.is_active)}>
              {emp.is_active
                ? <><UserX className="h-4 w-4 mr-2" /> Деактивировать</>
                : <><UserCheck className="h-4 w-4 mr-2" /> Активировать</>}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Badge variant="outline">{ROLE_LABELS[emp.role] ?? emp.role}</Badge>
        <Badge variant={TIER_BADGE[emp.tier] ?? "outline"}>
          {TIER_LABELS[emp.tier] ?? emp.tier}
        </Badge>
        {emp.is_active
          ? <Badge variant="success">Активен</Badge>
          : <Badge variant="secondary">Неактивен</Badge>}
      </div>
    </motion.div>
  );
}
