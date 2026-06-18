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
    <header className="md:hidden flex items-start justify-between px-4 pt-4 pb-3 bg-zinc-950 flex-shrink-0">
      <div>
        <p className="text-xs text-zinc-500">{dateStr}</p>
        <h1 className="text-2xl font-bold text-zinc-100 mt-0.5">
          Привет, {firstName}
        </h1>
      </div>

      <div className="flex items-center gap-2 mt-1">
        {/* Bell */}
        <NotificationsButton />

        {/* Avatar */}
        <Link href="/settings" className="w-9 h-9 rounded-full bg-[hsl(38,62%,40%)] flex items-center justify-center overflow-hidden flex-shrink-0">
          {photoUrl
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={photoUrl} alt="" className="w-full h-full object-cover" />
            : <span className="text-sm font-semibold text-white">{initials}</span>}
        </Link>
      </div>
    </header>
  );
}
