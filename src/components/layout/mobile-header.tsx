"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { NotificationsButton } from "./notifications-button";

const DAYS = ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];
const MONTHS = ["Января", "Февраля", "Марта", "Апреля", "Мая", "Июня",
  "Июля", "Августа", "Сентября", "Октября", "Ноября", "Декабря"];

interface MobileHeaderProps {
  userName: string;
  photoUrl?: string | null;
}

export function MobileHeader({ userName, photoUrl }: MobileHeaderProps) {
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    const now = new Date();
    setDateStr(`${now.getDate()} ${MONTHS[now.getMonth()]}, ${DAYS[now.getDay()]}`);
  }, []);

  const parts = userName.trim().split(" ");
  const firstName = parts.length >= 2 ? parts[1] : parts[0];
  const initials = parts.slice(0, 2).map((p) => p[0]).join("").toUpperCase();

  return (
    <header
      className="md:hidden flex items-start justify-between px-4 pt-4 pb-3 flex-shrink-0"
      style={{ background: "hsl(var(--card))", borderBottom: "1px solid hsl(var(--border))" }}
    >
      <div>
        <p className="text-xs text-muted-foreground">{dateStr}</p>
        <h1 className="font-display text-[22px] font-extrabold tracking-[-0.02em] mt-0.5">
          Привет, {firstName}
        </h1>
      </div>

      <div className="flex items-center gap-2 mt-1">
        <NotificationsButton />
        <Link
          href="/settings"
          className="w-9 h-9 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0 min-h-0 min-w-0"
          style={{ background: "hsl(var(--primary))" }}
        >
          {photoUrl
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={photoUrl} alt="" className="w-full h-full object-cover" />
            : <span className="text-sm font-semibold" style={{ color: "hsl(var(--primary-foreground))" }}>{initials}</span>}
        </Link>
      </div>
    </header>
  );
}
