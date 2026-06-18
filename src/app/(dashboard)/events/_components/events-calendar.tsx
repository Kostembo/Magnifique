"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import ruLocale from "@fullcalendar/core/locales/ru";
import { useState } from "react";
import { format } from "date-fns";
import type { EventCardData } from "@/components/events/event-card";
import { DayEventsSheet } from "./day-events-sheet";
import { MobileCalendar } from "./mobile-calendar";

const STATUS_COLORS: Record<string, string> = {
  draft: "#52525b",
  recruiting: "#1d4ed8",
  staffed: "#15803d",
  done: "#3f3f46",
};

interface Props { events: EventCardData[] }

export function EventsCalendar({ events }: Props) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const selectedDayEvents = selectedDate
    ? events.filter((e) => format(new Date(e.starts_at), "yyyy-MM-dd") === selectedDate)
    : [];

  const calEvents = events.map((e) => ({
    id: e.id,
    title: e.title,
    start: e.starts_at,
    backgroundColor: STATUS_COLORS[e.status] ?? STATUS_COLORS.draft,
    borderColor: "transparent",
    textColor: "#f4f4f5",
  }));

  return (
    <>
      {/* Mobile: кастомная сетка с точками */}
      <div className="md:hidden px-4 pb-24">
        <MobileCalendar events={events} onDateClick={setSelectedDate} />
      </div>

      {/* Desktop: FullCalendar */}
      <div className="hidden md:block fc-dark">
        <style>{`
          .fc-dark .fc-theme-standard td,.fc-dark .fc-theme-standard th,.fc-dark .fc-theme-standard .fc-scrollgrid{border-color:#27272a}
          .fc-dark .fc-col-header-cell{background:#18181b}
          .fc-dark .fc-col-header-cell-cushion{color:hsl(38,62%,48%);font-weight:500;text-decoration:none}
          .fc-dark .fc-daygrid-day{background:#09090b;cursor:pointer}
          .fc-dark .fc-day-other{background:#09090b!important;opacity:.35;pointer-events:none}
          .fc-dark .fc-daygrid-day:hover{background:#18181b}
          .fc-dark .fc-daygrid-day-number{color:#a1a1aa;text-decoration:none;font-size:.8rem}
          .fc-dark .fc-day-today{background:#1c1400!important}
          .fc-dark .fc-day-today .fc-daygrid-day-number{color:hsl(38,72%,62%);font-weight:700}
          .fc-dark .fc .fc-toolbar-title{color:hsl(38,62%,48%);font-size:1em;font-weight:600;background:#27272a;border:1px solid #3f3f46;border-radius:6px;padding:0 14px;margin:0;height:39px;display:inline-flex;align-items:center;box-sizing:border-box}
          .fc-dark .fc-button{background:#27272a;border-color:#3f3f46;color:#f4f4f5;border-radius:.75rem}
          .fc-dark .fc-button:hover{background:#3f3f46;color:#f4f4f5}
          .fc-dark .fc-prev-button,.fc-dark .fc-next-button{color:hsl(38,62%,48%)}
          .fc-dark .fc-prev-button:hover,.fc-dark .fc-next-button:hover{color:hsl(38,72%,62%);background:#3f3f46}
          .fc-dark .fc-today-button{color:hsl(38,62%,48%);background:#27272a;border-color:#3f3f46;opacity:1}
          .fc-dark .fc-today-button:disabled{color:#f4f4f5;opacity:1;cursor:default}
          .fc-dark .fc-button:focus{box-shadow:none}
          .fc-dark .fc-daygrid-event{border-radius:4px;font-size:.72rem;padding:1px 4px;cursor:pointer}
          .fc-dark .fc-daygrid-event:hover{filter:brightness(1.2)}
          .fc-dark .fc-more-link{color:hsl(38,72%,62%);font-size:.7rem}
          .fc-dark .fc-popover{background:#18181b;border-color:#27272a}
          .fc-dark .fc-popover-header{background:#27272a;color:#f4f4f5}
          .fc-dark .fc-popover-body{color:#a1a1aa}
          .fc-dark .fc-daygrid-day-frame{min-height:100px!important}
        `}</style>
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale={ruLocale}
          events={calEvents}
          headerToolbar={{ left: "title", center: "", right: "prev,next today" }}
          buttonText={{ today: "текущий месяц" }}
          showNonCurrentDates={true}
          fixedWeekCount={false}
          height="auto"
          dayMaxEvents={3}
          dateClick={(info) => setSelectedDate(info.dateStr)}
          eventClick={(info) => setSelectedDate(info.event.startStr.slice(0, 10))}
          eventDisplay="block"
        />
      </div>

      <DayEventsSheet
        date={selectedDate}
        events={selectedDayEvents}
        onClose={() => setSelectedDate(null)}
      />
    </>
  );
}
