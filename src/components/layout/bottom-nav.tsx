"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Users, CalendarDays, ClipboardList, Clock, Settings, Banknote } from "lucide-react";
import { motion, LayoutGroup } from "framer-motion";

type NavItem = { href: string; label: string; icon: React.ReactNode; roles: string[] };

const NAV_ITEMS: NavItem[] = [
  { href: "/events",       label: "Смены",     icon: <CalendarDays className="h-5 w-5" />, roles: ["waiter", "cook"] },
  { href: "/events",       label: "События",   icon: <CalendarDays className="h-5 w-5" />, roles: ["manager", "owner", "admin", "sales", "chef"] },
  { href: "/employees",    label: "Команда",   icon: <Users className="h-5 w-5" />,        roles: ["manager", "owner", "admin"] },
  { href: "/requisitions", label: "Заявки",    icon: <ClipboardList className="h-5 w-5" />, roles: ["manager", "warehouse", "owner", "admin"] },
  { href: "/timesheet",    label: "Табель",    icon: <Clock className="h-5 w-5" />,        roles: ["manager", "waiter", "cook", "owner", "admin"] },
  { href: "/payroll",     label: "Зарплаты",  icon: <Banknote className="h-5 w-5" />,     roles: ["manager", "owner", "admin", "accountant"] },
  { href: "/settings",     label: "Настройки", icon: <Settings className="h-5 w-5" />,     roles: ["manager", "waiter", "cook", "warehouse", "owner", "admin", "sales", "chef"] },
];

export function BottomNav({ role }: { role: string }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((i) => i.roles.includes(role));

  if (items.length === 0) return null;

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40"
      style={{
        background: "hsl(240 5% 9%)",
        borderTop: "1px solid hsl(var(--border))",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <LayoutGroup id="bottom-nav">
        <div className="flex items-stretch px-2">
          {items.map((item) => {
            const active = pathname === item.href || (pathname.startsWith(item.href + "/") && item.href !== "/");
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-0.5 flex-1 min-w-0 overflow-hidden py-1.5 min-h-[52px] text-[9px] font-medium transition-colors select-none",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="bottom-nav-active"
                    className="absolute inset-x-0.5 inset-y-0.5 rounded-xl"
                    style={{ background: "hsl(var(--primary)/0.12)" }}
                    transition={{ type: "spring", stiffness: 400, damping: 35 }}
                  />
                )}
                <span className="relative z-10">{item.icon}</span>
                <span className="relative z-10 leading-tight truncate w-full text-center px-0.5">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </LayoutGroup>
    </nav>
  );
}
