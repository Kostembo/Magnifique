"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Users, CalendarDays, ClipboardList, Clock, Settings } from "lucide-react";
import { motion, LayoutGroup } from "framer-motion";

type NavItem = { href: string; label: string; icon: React.ReactNode; roles: string[] };

const NAV_ITEMS: NavItem[] = [
  {
    href: "/events",
    label: "Смены",
    icon: <CalendarDays className="h-5 w-5" />,
    roles: ["waiter", "cook"],
  },
  {
    href: "/events",
    label: "События",
    icon: <CalendarDays className="h-5 w-5" />,
    roles: ["manager", "owner", "admin", "sales", "chef"],
  },
  {
    href: "/employees",
    label: "Команда",
    icon: <Users className="h-5 w-5" />,
    roles: ["manager", "owner", "admin"],
  },
  {
    href: "/requisitions",
    label: "Заявки",
    icon: <ClipboardList className="h-5 w-5" />,
    roles: ["manager", "warehouse", "owner", "admin"],
  },
  {
    href: "/timesheet",
    label: "Табель",
    icon: <Clock className="h-5 w-5" />,
    roles: ["manager", "waiter", "cook", "owner", "admin"],
  },
  {
    href: "/settings",
    label: "Настройки",
    icon: <Settings className="h-5 w-5" />,
    roles: ["manager", "waiter", "cook", "warehouse", "owner", "admin", "sales", "chef"],
  },
];

interface BottomNavProps {
  role: string;
}

export function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((i) => i.roles.includes(role));

  if (items.length === 0) return null;

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-zinc-950 border-t border-zinc-800"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <LayoutGroup id="bottom-nav">
        <div className="flex items-stretch px-2">
          {items.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-0.5 flex-1 py-2 min-h-[56px] text-[10px] font-medium transition-colors select-none",
                  active ? "text-[hsl(38,72%,62%)]" : "text-zinc-500"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="bottom-nav-active"
                    className="absolute inset-x-0.5 inset-y-0.5 rounded-xl bg-[hsl(38_62%_48%/0.12)]"
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
