"use client";

import { MobileCalendar } from "./mobile-calendar";
import type { EventCardData } from "@/components/events/event-card";

interface Props {
  events: EventCardData[];
  onDateClick?: (dateStr: string) => void;
}

export function EventsCalendar({ events, onDateClick }: Props) {
  return <MobileCalendar events={events} onDateClick={onDateClick ?? (() => {})} />;
}
