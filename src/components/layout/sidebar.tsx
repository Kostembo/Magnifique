"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { NavLinks } from "./nav-links";
import { MagnifiqueLogo } from "./logo";
import { ROLE_LABELS } from "@/lib/utils";

interface SidebarProps {
  userName: string;
  userRole: string;
}

export function Sidebar({ userName, userRole }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 min-h-screen bg-zinc-950 border-r border-zinc-800 px-4 py-6 gap-6">
        <div className="px-2">
          <MagnifiqueLogo size="lg" light />
        </div>

        <div className="px-2 pb-4 border-b border-zinc-800">
          <p className="text-sm font-medium text-zinc-100 truncate">{userName}</p>
          <p className="text-xs text-zinc-500 mt-0.5">{ROLE_LABELS[userRole] ?? userRole}</p>
        </div>

        <NavLinks role={userRole} />
      </aside>

      {/* Mobile header */}
      <header className="md:hidden flex items-center justify-between px-4 h-14 bg-zinc-950 border-b border-zinc-800 sticky top-0 z-40">
        <MagnifiqueLogo size="md" light />
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Открыть меню"
          className="p-2 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside className="relative flex flex-col w-72 max-w-[80vw] h-full bg-zinc-950 border-r border-zinc-800 px-4 py-6 gap-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <MagnifiqueLogo size="md" light />
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Закрыть меню"
                className="p-2 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-2 pb-4 border-b border-zinc-800">
              <p className="text-sm font-medium text-zinc-100 truncate">{userName}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{ROLE_LABELS[userRole] ?? userRole}</p>
            </div>

            <NavLinks role={userRole} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}
