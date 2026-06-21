"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Users, CalendarDays, ClipboardList, LogOut, Settings, Clock, Calendar } from "lucide-react";
import { signOut } from "next-auth/react";
import { motion, LayoutGroup } from "framer-motion";

type NavLink = { href: string; label: string; icon: React.ReactNode; roles: string[] };

const navLinks: NavLink[] = [
  { href: "/events",       label: "Мероприятия", icon: <CalendarDays className="h-5 w-5" />, roles: ["manager", "waiter", "cook", "owner", "admin", "sales", "chef"] },
  { href: "/employees",    label: "Сотрудники",  icon: <Users className="h-5 w-5" />,        roles: ["manager", "owner", "admin"] },
  { href: "/requisitions", label: "Заявки",      icon: <ClipboardList className="h-5 w-5" />, roles: ["manager", "warehouse", "owner", "admin"] },
  { href: "/calendar",     label: "Календарь",   icon: <Calendar className="h-5 w-5" />,     roles: ["manager", "waiter", "cook", "owner", "admin", "sales", "chef"] },
  { href: "/timesheet",    label: "Табель",      icon: <Clock className="h-5 w-5" />,        roles: ["manager", "waiter", "cook", "owner", "admin"] },
  { href: "/settings",     label: "Настройки",   icon: <Settings className="h-5 w-5" />,     roles: ["manager", "waiter", "cook", "warehouse", "owner", "admin", "sales", "chef"] },
];

interface NavLinksProps { role: string; onNavigate?: () => void; }

export function NavLinks({ role, onNavigate }: NavLinksProps) {
  const pathname = usePathname();
  const links = navLinks.filter((l) => l.roles.includes(role));

  return (
    <nav className="flex flex-col gap-1 flex-1">
      <LayoutGroup id="nav">
        {links.map((link) => {
          const active = pathname === link.href || pathname.startsWith(link.href + "/");
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              className={cn(
                "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors min-h-[44px]",
                active ? "text-primary" : "text-muted-foreground hover:text-white"
              )}
            >
              {active && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-xl"
                  style={{ background: "hsl(var(--primary)/0.12)", border: "1px solid hsl(var(--primary)/0.25)" }}
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-3">
                {link.icon}
                {link.label}
              </span>
            </Link>
          );
        })}
      </LayoutGroup>

      <div className="mt-auto pt-4" style={{ borderTop: "1px solid hsl(var(--border))" }}>
        <motion.button
          onClick={() => signOut({ callbackUrl: "/login" })}
          whileTap={{ scale: 0.97, transition: { type: "spring", stiffness: 400, damping: 30 } }}
          className="flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-white/10 hover:text-white transition-colors min-h-[44px]"
        >
          <LogOut className="h-5 w-5" />
          Выйти
        </motion.button>
      </div>
    </nav>
  );
}
