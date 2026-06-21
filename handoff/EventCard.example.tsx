"use client";
// ============================================================
// Образец: src/components/events/event-card.tsx в новой эстетике
// Под твою модель данных (Event/positions) — адаптируй поля под свой Prisma-тип.
// ============================================================
import Link from "next/link";
import { MagneticCard, StaffBar } from "@/lib/motion";

type Slot = { invite: "accepted" | "pending" | "declined" };
type Position = { role: string; need: number; slots: Slot[] };
type EventLite = {
  id: string;
  title: string;
  client: string;
  startsAt: string;        // ISO
  guests: number;
  status: "live" | "recruiting" | "staffed" | "draft";
  positions: Position[];
};

const STATUS = {
  live:       { label: "Идёт сейчас",       color: "hsl(var(--ok))" },
  recruiting: { label: "Набор",              color: "hsl(var(--warn))" },
  staffed:    { label: "Укомплектовано",     color: "hsl(var(--info))" },
  draft:      { label: "Черновик",           color: "hsl(var(--muted-foreground))" },
} as const;

function tally(ev: EventLite) {
  let need = 0, conf = 0;
  for (const p of ev.positions) {
    need += p.need;
    conf += p.slots.filter((s) => s.invite === "accepted").length;
  }
  return { need, conf, pct: need ? conf / need : 0 };
}

export function EventCard({ ev }: { ev: EventLite }) {
  const t = tally(ev);
  const sm = STATUS[ev.status];
  const time = new Date(ev.startsAt).toLocaleString("ru-RU", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
  const pctColor = t.pct >= 1 ? "hsl(var(--ok))" : t.pct < 0.5 ? "hsl(var(--bad))" : "hsl(var(--primary))";

  return (
    <Link href={`/events/${ev.id}`} className="block">
      <MagneticCard
        layoutId={`ev-${ev.id}`}
        className="mq-hair cursor-pointer rounded-3xl bg-card p-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-display text-[18px] font-extrabold leading-tight tracking-[-0.02em]">
              {ev.title}
            </p>
            <p className="mt-1 truncate text-[13px] text-muted-foreground">{ev.client}</p>
          </div>
          <span
            className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-semibold"
            style={{ color: sm.color, background: `${sm.color}1f` }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: sm.color }} />
            {sm.label}
          </span>
        </div>

        <div className="mt-3 flex items-center gap-4 text-[13px] text-muted-foreground">
          <span>{time}</span>
          <span>{ev.guests} гостей</span>
        </div>

        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[12px] text-muted-foreground">Бригада</span>
            <span className="font-display text-[12px] font-bold tabular-nums" style={{ color: pctColor }}>
              {t.conf}/{t.need}
            </span>
          </div>
          <StaffBar value={t.pct} />
        </div>
      </MagneticCard>
    </Link>
  );
}
