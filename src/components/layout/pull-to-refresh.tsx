"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

const THRESHOLD = 72;
const MIN_PULL = 15;

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

    // On mobile we use body scroll (no overflow:hidden ancestors) — attach to window.
    // On desktop we use the contained scroll div — attach to el with passive:false so we
    // can call e.preventDefault() to prevent the native over-scroll while pulling.
    const mobile = window.innerWidth < 768;
    const target: EventTarget = mobile ? window : el;
    const getScrollTop = () => (mobile ? window.scrollY : el.scrollTop);

    function onTouchStart(e: TouchEvent) {
      if (getScrollTop() > 0) return;
      startYRef.current = e.touches[0].clientY;
      pullDistRef.current = 0;
      pullingRef.current = true;
    }

    function onTouchMove(e: TouchEvent) {
      if (!pullingRef.current) return;
      if (getScrollTop() > 0) { pullingRef.current = false; return; }
      const dist = Math.max(0, e.touches[0].clientY - startYRef.current);
      if (dist > MIN_PULL) {
        // Only call preventDefault on desktop (passive:false) — prevents native over-scroll
        if (!mobile) e.preventDefault();
        const clamped = Math.min((dist - MIN_PULL) * 0.55, THRESHOLD + 20);
        pullDistRef.current = clamped;
        setPullDist(clamped);
      }
    }

    function onTouchEnd() {
      if (!pullingRef.current) return;
      pullingRef.current = false;
      const dist = pullDistRef.current;
      pullDistRef.current = 0;
      if (dist > 0) setPullDist(0);
      if (dist >= THRESHOLD) {
        startTransition(() => { router.refresh(); });
      }
    }

    target.addEventListener("touchstart", onTouchStart as EventListener, { passive: true });
    // passive:true on mobile (can't preventDefault), passive:false on desktop
    target.addEventListener("touchmove", onTouchMove as EventListener, { passive: mobile });
    target.addEventListener("touchend", onTouchEnd as EventListener, { passive: true });

    return () => {
      target.removeEventListener("touchstart", onTouchStart as EventListener);
      target.removeEventListener("touchmove", onTouchMove as EventListener);
      target.removeEventListener("touchend", onTouchEnd as EventListener);
    };
  }, [router, startTransition]);

  const progress = Math.min(pullDist / THRESHOLD, 1);

  return (
    // md:overflow-y-auto — desktop uses contained scroll; mobile uses body scroll
    <div ref={containerRef} className="flex-1 md:overflow-y-auto overflow-x-hidden min-w-0">
      {/* Pull indicator */}
      <div
        className="flex items-center justify-center overflow-hidden transition-[height] duration-200"
        style={{ height: isPending ? THRESHOLD : pullDist > 0 ? pullDist : 0 }}
      >
        <RefreshCw
          className="text-primary"
          style={{
            width: 22, height: 22,
            transform: `rotate(${isPending ? 0 : progress * 360}deg)`,
            animation: isPending ? "spin 0.7s linear infinite" : "none",
            opacity: isPending ? 1 : progress,
          }}
        />
      </div>
      {/* Bottom padding accounts for nav bar + safe-area on iPhone */}
      <div className="pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))] md:pb-0">
        {children}
      </div>
    </div>
  );
}
