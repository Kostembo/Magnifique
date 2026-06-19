"use client";

import { NavLinks } from "./nav-links";
import { MagnifiqueLogo } from "./logo";
import { NotificationsButton } from "./notifications-button";
import { ROLE_LABELS } from "@/lib/utils";

interface SidebarProps {
  userName: string;
  userRole: string;
}

export function Sidebar({ userName, userRole }: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col w-64 min-h-screen px-4 py-6 gap-6"
        style={{ background: "hsl(240 5% 9%)", borderRight: "1px solid hsl(var(--border))" }}
      >
        <div className="px-2">
          <MagnifiqueLogo size="lg" light />
        </div>

        <div className="px-2 pb-4 flex items-center justify-between gap-2" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
          <div className="min-w-0">
            <p className="text-sm font-display font-semibold truncate">{userName}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{ROLE_LABELS[userRole] ?? userRole}</p>
          </div>
          <NotificationsButton />
        </div>

        <NavLinks role={userRole} />
      </aside>

    </>
  );
}
