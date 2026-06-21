"use client";

import Link from "next/link";

export type Invitation = {
  id: string;
  event: { id: string; title: string; client: string | null; starts_at: string };
  position: { role: string };
};

export type RecruitingEvent = {
  eventId: string;
  title: string;
  client: string | null;
  starts_at: string;
  slotsLeft: number;
  neededCount: number;
};

export type StaffData = { invitations: Invitation[]; recruiting: RecruitingEvent[] };

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}

export function StaffPanel({ data, close }: { data: StaffData; close: () => void }) {
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
            <div key={rec.eventId} className="px-4 py-3 border-b border-zinc-800/60">
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
