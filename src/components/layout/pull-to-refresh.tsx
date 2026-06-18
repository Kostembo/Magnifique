"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

const THRESHOLD = 72;

export function PullToRefresh({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const pullDistRef = useRef(0);
  const [pullDist, setPullDist] = useState(0);
  const [isPending, startTransition] = useTransition();
  const pullingRef = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function onTouchStart(e: TouchEvent) {
      if (el!.scrollTop > 0) return;
      startYRef.current = e.touches[0].clientY;
      pullingRef.current = true;
    }

    function onTouchMove(e: TouchEvent) {
      if (!pullingRef.current) return;
      const dist = Math.max(0, e.touches[0].clientY - startYRef.current);
      if (dist > 0 && el!.scrollTop === 0) {
        e.preventDefault();
        const clamped = Math.min(dist * 0.5, THRESHOLD + 20);
        pullDistRef.current = clamped;
        setPullDist(clamped);
      }
    }

    function onTouchEnd() {
      if (!pullingRef.current) return;
      pullingRef.current = false;
      const dist = pullDistRef.current;
      pullDistRef.current = 0;
      setPullDist(0);
      if (dist >= THRESHOLD) {
        startTransition(() => { router.refresh(); });
      }
    }

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [router, startTransition]);

  const progress = Math.min(pullDist / THRESHOLD, 1);

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto overflow-x-hidden min-w-0">
      {/* Pull indicator */}
      <div
        className="flex items-center justify-center overflow-hidden transition-all duration-200"
        style={{ height: isPending ? THRESHOLD : pullDist > 0 ? pullDist : 0 }}
      >
        <RefreshCw
          className="text-[hsl(38,62%,48%)]"
          style={{
            width: 22, height: 22,
            transform: `rotate(${isPending ? 0 : progress * 360}deg)`,
            animation: isPending ? "spin 0.7s linear infinite" : "none",
            opacity: isPending ? 1 : progress,
          }}
        />
      </div>
      <div className="pb-16 md:pb-0">
        {children}
      </div>
    </div>
  );
}
