"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import ruLocale from "@fullcalendar/core/locales/ru";
import { useRouter } from "next/navigation";

type CalendarEvent = {
  id: string;
  title: string;
  starts_at: Date | string;
  status: string;
};

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  draft:      { bg: "#52525b", text: "#f4f4f5" },
  recruiting: { bg: "hsl(38,62%,48%)", text: "#0a0a0a" },
  staffed:    { bg: "#16a34a", text: "#f0fdf4" },
  done:       { bg: "#3f3f46", text: "#71717a" },
};

interface Props { events: CalendarEvent[] }

export function ManagerCalendar({ events }: Props) {
  const router = useRouter();

  const calEvents = events.map((e) => {
    const color = STATUS_COLOR[e.status] ?? STATUS_COLOR.draft;
    return {
      id: e.id,
      title: e.title,
      start: e.starts_at,
      backgroundColor: color.bg,
      borderColor: "transparent",
      textColor: color.text,
    };
  });

  return (
    <div className="fc-dark">
      <style>{`
        .fc-dark .fc-theme-standard td,
        .fc-dark .fc-theme-standard th,
        .fc-dark .fc-theme-standard .fc-scrollgrid { border-color: #27272a; }
        .fc-dark .fc-col-header-cell { background: #18181b; }
        .fc-dark .fc-col-header-cell-cushion { color: hsl(38,62%,48%); font-weight: 500; text-decoration: none; }
        .fc-dark .fc-daygrid-day { background: #09090b; }
        .fc-dark .fc-day-other { background: transparent !important; border-color: transparent !important; pointer-events: none; }
        .fc-dark .fc-daygrid-day:hover { background: #18181b; }
        .fc-dark .fc-daygrid-day-number { color: #a1a1aa; text-decoration: none; font-size: 0.8rem; }
        .fc-dark .fc-day-today { background: #1c1400 !important; }
        .fc-dark .fc-day-today .fc-daygrid-day-number { color: hsl(38,72%,62%); font-weight: 700; }
        .fc-dark .fc .fc-toolbar-title { color: hsl(38,62%,48%); font-size: 1em; font-weight: 600; background: #27272a; border: 1px solid #3f3f46; border-radius: 6px; padding: 0 14px; margin: 0; height: 39px; display: inline-flex; align-items: center; box-sizing: border-box; }
        .fc-dark .fc-button { background: #27272a; border-color: #3f3f46; color: #f4f4f5; border-radius: 0.75rem; }
        .fc-dark .fc-button:hover { background: #3f3f46; color: #f4f4f5; }
        .fc-dark .fc-prev-button, .fc-dark .fc-next-button { color: hsl(38,62%,48%); }
        .fc-dark .fc-prev-button:hover, .fc-dark .fc-next-button:hover { color: hsl(38,72%,62%); background: #3f3f46; }
        .fc-dark .fc-today-button { color: hsl(38,62%,48%); background: #27272a; border-color: #3f3f46; opacity: 1; }
        .fc-dark .fc-today-button:disabled { color: #f4f4f5; background: #27272a; border-color: #3f3f46; opacity: 1; cursor: default; }
        .fc-dark .fc-button:focus { box-shadow: none; }
        .fc-dark .fc-daygrid-event { border-radius: 4px; font-size: 0.72rem; padding: 1px 4px; cursor: pointer; }
        .fc-dark .fc-daygrid-event:hover { opacity: 0.85; }
        .fc-dark .fc-more-link { color: hsl(38,72%,62%); font-size: 0.7rem; }
        .fc-dark .fc-popover { background: #18181b; border-color: #27272a; }
        .fc-dark .fc-popover-header { background: #27272a; color: #f4f4f5; }
        .fc-dark .fc-popover-body { color: #a1a1aa; }
        @media (max-width: 640px) {
          .fc-dark .fc .fc-toolbar-title { font-size: 0.8rem; padding: 0 8px; height: 32px; }
          .fc-dark .fc-button { font-size: 0.75rem; padding: 0.3em 0.5em; }
          .fc-dark .fc-toolbar.fc-header-toolbar { gap: 6px; }
        }
      `}</style>
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        locale={ruLocale}
        events={calEvents}
        headerToolbar={{ left: "title", center: "", right: "prev,next today" }}
        buttonText={{ today: "текущий месяц" }}
        showNonCurrentDates={false}
        fixedWeekCount={false}
        height="auto"
        expandRows={true}
        dayMaxEvents={4}
        eventDisplay="block"
        eventClick={(info) => {
          info.jsEvent.preventDefault();
          router.push(`/events/${info.event.id}`);
        }}
      />
    </div>
  );
}
