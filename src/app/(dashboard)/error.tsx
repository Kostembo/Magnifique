"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
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
    <div className="flex flex-col items-center justify-center h-full gap-4 p-6 text-center min-h-[400px]">
      <AlertTriangle className="h-10 w-10 text-destructive" />
      <p className="font-semibold text-lg">Ошибка загрузки страницы</p>
      <p className="text-muted-foreground text-sm max-w-xs">
        {error.message || "Произошла непредвиденная ошибка. Попробуйте ещё раз."}
      </p>
      <Button onClick={reset} variant="outline" className="rounded-xl">
        Повторить
      </Button>
    </div>
  );
}
