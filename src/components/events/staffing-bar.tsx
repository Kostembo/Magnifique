import { cn } from "@/lib/utils";

interface StaffingBarProps {
  confirmed: number;
  needed: number;
  className?: string;
}

export function StaffingBar({ confirmed, needed, className }: StaffingBarProps) {
  const pct = needed === 0 ? 100 : Math.min(100, Math.round((confirmed / needed) * 100));
  const missing = Math.max(0, needed - confirmed);

  const color =
    pct >= 100
      ? "bg-green-500"
      : pct >= 60
      ? "bg-yellow-400"
      : "bg-red-500";

  const textColor =
    pct >= 100
      ? "text-green-700"
      : pct >= 60
      ? "text-yellow-700"
      : "text-red-700";

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center justify-between text-xs">
        <span className={cn("font-medium", textColor)}>
          {confirmed}/{needed}
        </span>
        {missing > 0 && (
          <span className={cn("font-medium", textColor)}>не хватает {missing}</span>
        )}
        {missing === 0 && (
          <span className="text-green-700 font-medium">укомплектовано</span>
        )}
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
