"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Check, X, MapPin, Clock, Star, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { ROLE_LABELS } from "@/lib/utils";
import dynamic from "next/dynamic";
const StaffCalendar = dynamic(() => import("./staff-calendar").then((m) => m.StaffCalendar), { ssr: false });

type Invitation = {
  id: string;
  is_priority: boolean;
  event: {
    id: string;
    title: string;
    client?: string | null;
    location?: string | null;
    starts_at: Date | string;
  };
  position: { role: string; needed_count: number };
};

type Shift = {
  id: string;
  event: {
    id: string;
    title: string;
    client?: string | null;
    location?: string | null;
    starts_at: Date | string;
    status: string;
  };
};

interface Props {
  invitations: Invitation[];
  shifts: Shift[];
}

function EventInfo({ title, client, location, starts_at }: { title: string; client?: string | null; location?: string | null; starts_at: Date | string }) {
  return (
    <div className="space-y-1">
      <p className="font-semibold">{title}</p>
      {client && <p className="text-sm text-muted-foreground">{client}</p>}
      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {format(new Date(starts_at), "d MMMM, HH:mm", { locale: ru })}
        </span>
        {location && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {location}
          </span>
        )}
      </div>
    </div>
  );
}

export function EventsStaff({ invitations: initial, shifts }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [invitations, setInvitations] = useState(initial);
  const [responding, setResponding] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "calendar">("list");

  async function respond(assignmentId: string, action: "confirm" | "decline") {
    setResponding(assignmentId);
    const res = await fetch(`/api/assignments/${assignmentId}/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });

    const data = await res.json();
    setResponding(null);

    if (res.ok) {
      if (data.status === "waitlisted") {
        toast({
          title: "Вы в листе ожидания",
          description: "Все слоты заняты, но вы добавлены в лист ожидания",
          variant: "default",
        });
      } else {
        toast({
          title: action === "confirm" ? "Смена подтверждена!" : "Вы отказались от смены",
          variant: action === "confirm" ? "success" : "default",
        });
        setInvitations((prev) => prev.filter((inv) => inv.id !== assignmentId));
        if (action === "confirm") {
          startTransition(() => router.refresh());
        }
      }
    } else {
      toast({ title: "Ошибка", description: data.error, variant: "destructive" });
    }
  }

  return (
    <div className={view === "calendar" ? "space-y-4" : "p-4 md:p-6 space-y-6 max-w-2xl mx-auto"}>
      {/* Header с переключателем */}
      <div className={`flex items-center justify-between gap-3 ${view === "calendar" ? "px-4 md:px-6 pt-4 md:pt-6" : ""}`}>
        <h1 className="text-2xl font-semibold">Мероприятия</h1>
        <div className="flex rounded-lg border overflow-hidden">
          <button
            onClick={() => setView("list")}
            className={`px-3 py-1.5 text-sm font-medium transition-colors min-h-0 ${view === "list" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
          >
            Список
          </button>
          <button
            onClick={() => setView("calendar")}
            className={`px-3 py-1.5 text-sm font-medium transition-colors min-h-0 ${view === "calendar" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
          >
            Календарь
          </button>
        </div>
      </div>

      {view === "calendar" && (
        <div className="px-4 md:px-6 pb-4 md:pb-6">
          <StaffCalendar shifts={shifts} />
        </div>
      )}

      {view === "list" && <>
      {/* Приглашения */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Тебя зовут</h2>
          {invitations.length > 0 && (
            <Badge variant="danger">{invitations.length}</Badge>
          )}
        </div>

        {invitations.length === 0 && (
          <p className="text-muted-foreground text-sm">Новых приглашений нет</p>
        )}

        {invitations.map((inv) => (
          <Card key={inv.id} className={inv.is_priority ? "border-amber-300 bg-amber-50/30" : ""}>
            <CardContent className="p-4 space-y-3">
              {inv.is_priority && (
                <div className="flex items-center gap-1.5 text-xs text-amber-700 font-medium">
                  <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                  Приоритетное — слот за тобой
                </div>
              )}
              <EventInfo {...inv.event} />
              <p className="text-xs text-muted-foreground">
                Роль: {ROLE_LABELS[inv.position.role] ?? inv.position.role}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => respond(inv.id, "confirm")}
                  disabled={responding === inv.id || isPending}
                >
                  {responding === inv.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <><Check className="h-4 w-4 mr-1.5" /> Подтвердить</>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => respond(inv.id, "decline")}
                  disabled={responding === inv.id || isPending}
                >
                  <X className="h-4 w-4 mr-1.5" />
                  Не смогу
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Подтверждённые смены */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Мои смены</h2>

        {shifts.length === 0 && (
          <p className="text-muted-foreground text-sm">Нет предстоящих смен</p>
        )}

        {shifts.map((shift) => (
          <Card key={shift.id}>
            <CardContent className="p-4 space-y-2">
              <EventInfo {...shift.event} />
              <Badge variant="success">Подтверждено</Badge>
            </CardContent>
          </Card>
        ))}
      </section>
      </>}
    </div>
  );
}
