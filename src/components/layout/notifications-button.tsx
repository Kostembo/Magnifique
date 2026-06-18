"use client";

import { Bell, X, ChevronRight } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Invitation = {
  id: string;
  event: { id: string; title: string; client: string | null; starts_at: string };
  position: { role: string };
};

type RecruitingEvent = {
  eventId: string;
  title: string;
  client: string | null;
  starts_at: string;
  slotsLeft: number;
  neededCount: number;
};

type ManagerEvent = {
  eventId: string;
  title: string;
  starts_at: string;
  status: string;
  totalNeeded: number;
  totalConfirmed: number;
};

type StaffData = { invitations: Invitation[]; recruiting: RecruitingEvent[] };
type ManagerData = { events: ManagerEvent[] };
type NotifData = StaffData | ManagerData | null;

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}

const STATUS_LABEL: Record<string, string> = { draft: "Черновик", recruiting: "Набор" };

function StaffPanel({ data, close }: { data: StaffData; close: () => void }) {
  if (!data.invitations.length && !data.recruiting.length) {
    return <p className="p-5 text-sm text-zinc-500">Нет новых уведомлений</p>;
  }
  return (
    <div>
      {data.invitations.length > 0 && (
        <>
          <p className="px-4 pt-4 pb-1 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
            Приглашения
          </p>
          {data.invitations.map((inv) => (
            <Link
              key={inv.id}
              href={`/invite/${inv.event.id}`}
              onClick={close}
              className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-900 transition-colors border-b border-zinc-800/60"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-100 truncate">{inv.event.title}</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {fmt(inv.event.starts_at)}
                  {inv.event.client ? ` · ${inv.event.client}` : ""}
                </p>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[hsl(38_62%_48%/0.18)] text-[hsl(38,72%,65%)] shrink-0">
                Ответить
              </span>
            </Link>
          ))}
        </>
      )}

      {data.recruiting.length > 0 && (
        <>
          <p className="px-4 pt-4 pb-1 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
            Идёт набор
          </p>
          {data.recruiting.map((rec) => (
            <div
              key={rec.eventId}
              className="px-4 py-3 border-b border-zinc-800/60"
            >
              <p className="text-sm font-medium text-zinc-100 truncate">{rec.title}</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {fmt(rec.starts_at)}
                {rec.client ? ` · ${rec.client}` : ""}
              </p>
              {rec.slotsLeft === 0 ? (
                <p className="text-xs text-zinc-600 mt-1">Все места заняты</p>
              ) : (
                <p className="text-xs text-[hsl(38,72%,62%)] mt-1">
                  Свободно мест: {rec.slotsLeft} из {rec.neededCount}
                </p>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function ManagerPanel({ data, close }: { data: ManagerData; close: () => void }) {
  if (!data.events.length) {
    return <p className="p-5 text-sm text-zinc-500">Нет мероприятий требующих внимания</p>;
  }
  return (
    <div>
      <p className="px-4 pt-4 pb-1 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
        Мероприятия
      </p>
      {data.events.map((ev) => (
        <Link
          key={ev.eventId}
          href={`/events/${ev.eventId}`}
          onClick={close}
          className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-900 transition-colors border-b border-zinc-800/60"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-100 truncate">{ev.title}</p>
            <p className="text-xs text-zinc-500 mt-0.5">
              {fmt(ev.starts_at)} · {STATUS_LABEL[ev.status] ?? ev.status}
            </p>
            <p className={cn("text-xs mt-0.5", ev.totalConfirmed < ev.totalNeeded ? "text-amber-500" : "text-zinc-400")}>
              Подтверждено: {ev.totalConfirmed} / {ev.totalNeeded}
              {ev.totalConfirmed < ev.totalNeeded ? " — нужны люди" : ""}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-zinc-600 shrink-0" />
        </Link>
      ))}
    </div>
  );
}

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
