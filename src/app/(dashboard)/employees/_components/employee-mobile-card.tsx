"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, KeyRound, User, CalendarPlus } from "lucide-react";
import { ROLE_LABELS, TIER_LABELS, formatPhone } from "@/lib/utils";
import { fadeUp } from "@/lib/motion";

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
  photo_url?: string | null;
};

interface Props {
  emp: Employee;
  index: number;
  onEdit: (id: string) => void;
  onResetPassword: (emp: Employee) => void;
  onInvite: (emp: Employee) => void;
}

export function EmployeeMobileCard({ emp, index, onEdit, onResetPassword, onInvite }: Props) {
  return (
    <motion.div
      variants={fadeUp}
      custom={index}
      className="rounded-3xl mq-hair p-4 space-y-3"
      style={{ background: "hsl(var(--card))" }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-muted border border-border overflow-hidden flex-shrink-0 flex items-center justify-center">
            {emp.photo_url
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={emp.photo_url} alt="" className="w-full h-full object-cover" />
              : <User className="h-5 w-5 text-muted-foreground" />}
          </div>
          <div>
            <p className="font-display font-bold text-[15px] leading-tight">{emp.full_name}</p>
            <p className="text-[13px] text-muted-foreground mt-0.5 tabular-nums">{formatPhone(emp.phone)}</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Действия" className="rounded-xl">
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
            <DropdownMenuItem onClick={() => onInvite(emp)}>
              <CalendarPlus className="h-4 w-4 mr-2" /> Пригласить на мероприятие
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Badge variant="outline">{ROLE_LABELS[emp.role] ?? emp.role}</Badge>
        <Badge variant={TIER_BADGE[emp.tier] ?? "outline"}>{TIER_LABELS[emp.tier] ?? emp.tier}</Badge>
      </div>
    </motion.div>
  );
}
