"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen gap-4 p-6 text-center"
      style={{ background: "hsl(240 5% 9%)" }}
    >
      <p className="text-white text-xl font-semibold">Что-то пошло не так</p>
      <p className="text-zinc-400 text-sm max-w-xs">
        Произошла непредвиденная ошибка. Попробуйте обновить страницу.
      </p>
      <Button onClick={reset} variant="outline" className="rounded-xl">
        Повторить
      </Button>
    </div>
  );
}
