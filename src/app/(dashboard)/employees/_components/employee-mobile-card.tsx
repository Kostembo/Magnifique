"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, KeyRound, User, CalendarPlus } from "lucide-react";
import { ROLE_LABELS, TIER_LABELS, formatPhone } from "@/lib/utils";
import { fadeUp } from "@/lib/motion";
import type { CSSProperties } from "react";

const TIER_CHIP: Record<string, CSSProperties> = {
  core:    { background: "hsl(270 50% 18%)", color: "hsl(270 65% 72%)" },
  regular: { background: "hsl(30 50% 16%)",  color: "hsl(30 70% 62%)" },
  trainee: { background: "hsl(143 55% 18%)", color: "hsl(143 60% 68%)" },
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
  onResetPassword: (emp: Employee) => void;
  onInvite: (emp: Employee) => void;
}

export function EmployeeMobileCard({ emp, index, onResetPassword, onInvite }: Props) {
  const router = useRouter();

  return (
    <motion.div
      variants={fadeUp}
      custom={index}
      className="rounded-3xl mq-hair p-4 space-y-3 cursor-pointer"
      style={{ background: "hsl(var(--card))" }}
      onClick={() => router.push(`/employees/${emp.id}`)}
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
            <Button
              variant="ghost"
              size="icon"
              aria-label="Действия"
              className="rounded-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onResetPassword(emp); }}>
              <KeyRound className="h-4 w-4 mr-2" /> Сбросить пароль
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onInvite(emp); }}>
              <CalendarPlus className="h-4 w-4 mr-2" /> Пригласить на мероприятие
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <span className="inline-flex items-center px-3 py-1 rounded-xl bg-muted text-[13px] font-medium text-foreground">
          {ROLE_LABELS[emp.role] ?? emp.role}
        </span>
        <span className="inline-flex items-center px-3 py-1 rounded-xl text-[13px] font-medium"
          style={TIER_CHIP[emp.tier] ?? TIER_CHIP.regular}>
          {TIER_LABELS[emp.tier] ?? emp.tier}
        </span>
      </div>
    </motion.div>
  );
}
