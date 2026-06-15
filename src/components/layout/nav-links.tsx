"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Users, CalendarDays, ClipboardList, LogOut, Settings, Clock } from "lucide-react";
import { signOut } from "next-auth/react";

type NavLink = { href: string; label: string; icon: React.ReactNode; roles: string[] };

const navLinks: NavLink[] = [
  {
    href: "/events",
    label: "Мероприятия",
    icon: <CalendarDays className="h-5 w-5" />,
    roles: ["manager", "waiter", "cook"],
  },
  {
    href: "/employees",
    label: "Сотрудники",
    icon: <Users className="h-5 w-5" />,
    roles: ["manager"],
  },
  {
    href: "/requisitions",
    label: "Заявки",
    icon: <ClipboardList className="h-5 w-5" />,
    roles: ["manager", "warehouse"],
  },
  {
    href: "/timesheet",
    label: "Табель",
    icon: <Clock className="h-5 w-5" />,
    roles: ["manager", "waiter", "cook"],
  },
  {
    href: "/settings",
    label: "Настройки",
    icon: <Settings className="h-5 w-5" />,
    roles: ["manager", "waiter", "cook", "warehouse"],
  },
];

interface NavLinksProps {
  role: string;
  onNavigate?: () => void;
}

export function NavLinks({ role, onNavigate }: NavLinksProps) {
  const pathname = usePathname();
  const links = navLinks.filter((l) => l.roles.includes(role));

  return (
    <nav className="flex flex-col gap-1 flex-1">
      {links.map((link) => {
        const active = pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all min-h-[44px]",
              active
                ? "bg-[hsl(38_62%_48%/0.15)] text-[hsl(38,72%,62%)] border border-[hsl(38_62%_48%/0.3)]"
                : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 border border-transparent"
            )}
          >
            {link.icon}
            {link.label}
          </Link>
        );
      })}

      <div className="mt-auto pt-4 border-t border-zinc-800">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-all min-h-[44px] border border-transparent"
        >
          <LogOut className="h-5 w-5" />
          Выйти
        </button>
      </div>
    </nav>
  );
}
