"use client";

import { Bell, X } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { StaffPanel } from "./_panels/staff-panel";
import { ManagerPanel } from "./_panels/manager-panel";
import type { StaffData } from "./_panels/staff-panel";
import type { ManagerData } from "./_panels/manager-panel";

type NotifData = StaffData | ManagerData | null;

export function NotificationsButton() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<NotifData>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const badge = data
    ? "invitations" in data
      ? data.invitations.length
      : data.events.filter((e) => e.totalConfirmed < e.totalNeeded).length
    : 0;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative p-2 rounded-full hover:bg-zinc-800 transition-colors"
        aria-label="Уведомления"
      >
        <Bell className="h-5 w-5 text-zinc-400" />
        {badge > 0 && (
          <span className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-[hsl(38,72%,62%)] text-zinc-950 text-[10px] font-bold flex items-center justify-center">
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="relative ml-auto w-full sm:w-80 h-full bg-zinc-950 border-l border-zinc-800 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-800 shrink-0">
              <h2 className="text-base font-semibold text-zinc-100">Уведомления</h2>
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-zinc-800 transition-colors">
                <X className="h-5 w-5 text-zinc-400" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <p className="p-5 text-sm text-zinc-500">Загрузка...</p>
              ) : !data ? (
                <p className="p-5 text-sm text-zinc-500">Не удалось загрузить</p>
              ) : "invitations" in data ? (
                <StaffPanel data={data} close={() => setOpen(false)} />
              ) : (
                <ManagerPanel data={data} close={() => setOpen(false)} />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
