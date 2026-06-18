"use client";

import { useState } from "react";
import { Check, X, MapPin, Users, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

type State = "idle" | "loading" | "confirmed" | "declined" | "waitlisted";

interface Props {
  assignmentId: string;
  event: {
    id: string;
    title: string;
    client: string | null;
    location: string | null;
    starts_at: string;
  };
}

export function InviteResponseClient({ assignmentId, event }: Props) {
  const [state, setState] = useState<State>("idle");

  const dateStr = new Date(event.starts_at).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeStr = new Date(event.starts_at).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });

  async function respond(action: "confirm" | "decline") {
    setState("loading");
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        const data = await res.json();
        setState(
          data.status === "waitlisted" ? "waitlisted" :
          action === "confirm" ? "confirmed" : "declined"
        );
      } else {
        setState("idle");
      }
    } catch {
      setState("idle");
    }
  }

  if (state === "confirmed") {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-5 text-center px-6">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
          <Check className="h-10 w-10 text-green-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Участие подтверждено!</h2>
          <p className="text-sm text-muted-foreground mt-1">{event.title}</p>
          <p className="text-sm text-muted-foreground mt-0.5">{dateStr}</p>
        </div>
        <a href="/events" className="text-sm text-[hsl(38,62%,48%)] underline underline-offset-2">
          К моим мероприятиям
        </a>
      </div>
    );
  }

  if (state === "waitlisted") {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-5 text-center px-6">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
          <Users className="h-10 w-10 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Места на «{event.title}» закончились.</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Менеджер видит, что вы хотели подтвердить, и по возможности добавит вас.
          </p>
        </div>
        <a href="/events" className="text-sm text-[hsl(38,62%,48%)] underline underline-offset-2">
          Назад
        </a>
      </div>
    );
  }

  if (state === "declined") {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-5 text-center px-6">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
          <X className="h-10 w-10 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Отказ отправлен</h2>
          <p className="text-sm text-muted-foreground mt-1">{event.title}</p>
        </div>
        <a href="/events" className="text-sm text-[hsl(38,62%,48%)] underline underline-offset-2">
          Назад
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-36">
      <p className="text-xs font-semibold text-[hsl(38,62%,48%)] uppercase tracking-wider mb-3">
        Приглашение на мероприятие
      </p>

      <div className="rounded-xl border bg-card text-card-foreground p-5 space-y-4 shadow-sm">
        <h1 className="text-2xl font-bold leading-tight">{event.title}</h1>

        <div className="space-y-2.5 text-sm text-muted-foreground">
          <p className="flex items-center gap-2.5">
            <Calendar className="h-4 w-4 shrink-0" />
            {dateStr}
          </p>
          <p className="flex items-center gap-2.5">
            <Clock className="h-4 w-4 shrink-0" />
            {timeStr}
          </p>
          {event.location && (
            <p className="flex items-center gap-2.5">
              <MapPin className="h-4 w-4 shrink-0" />
              {event.location}
            </p>
          )}
          {event.client && (
            <p className="flex items-center gap-2.5">
              <Users className="h-4 w-4 shrink-0" />
              {event.client}
            </p>
          )}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Button
          size="lg"
          disabled={state === "loading"}
          onClick={() => respond("decline")}
          className="h-14 text-base rounded-xl bg-red-600 hover:bg-red-700 text-white justify-center"
        >
          Отклонить
        </Button>
        <Button
          size="lg"
          disabled={state === "loading"}
          onClick={() => respond("confirm")}
          className="h-14 text-base rounded-xl bg-green-600 hover:bg-green-700 text-white"
        >
          <Check className="h-5 w-5 mr-2" />
          Подтвердить
        </Button>
      </div>

      {state === "loading" && (
        <p className="text-center text-sm text-muted-foreground mt-4">Отправляем ответ…</p>
      )}
    </div>
  );
}
