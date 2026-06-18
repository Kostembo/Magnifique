"use client";

import { NavLinks } from "./nav-links";
import { BottomNav } from "./bottom-nav";
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
      <aside className="hidden md:flex flex-col w-64 min-h-screen bg-zinc-950 border-r border-zinc-800 px-4 py-6 gap-6">
        <div className="px-2">
          <MagnifiqueLogo size="lg" light />
        </div>

        <div className="px-2 pb-4 border-b border-zinc-800 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium text-zinc-100 truncate">{userName}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{ROLE_LABELS[userRole] ?? userRole}</p>
          </div>
          <NotificationsButton />
        </div>

        <NavLinks role={userRole} />
      </aside>

      {/* Mobile bottom nav */}
      <BottomNav role={userRole} />
    </>
  );
}
