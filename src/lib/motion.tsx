"use client";
import { motion, useMotionValue, useSpring, type MotionProps } from "framer-motion";
import { useRef, type ReactNode, type CSSProperties } from "react";

export const spring = { type: "spring", stiffness: 350, damping: 28 } as const;
export const springSoft = { type: "spring", stiffness: 300, damping: 25 } as const;

export const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};
export const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: spring },
};

export function MagneticCard({
  children, onClick, layoutId, className, style, strength = 10,
}: {
  children: ReactNode;
  onClick?: () => void;
  layoutId?: string;
  className?: string;
  style?: CSSProperties;
  strength?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, springSoft);
  const sy = useSpring(y, springSoft);

  return (
    <motion.div
      ref={ref}
      layoutId={layoutId}
      onClick={onClick}
      onMouseMove={(e) => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        x.set(((e.clientX - (r.left + r.width / 2)) / r.width) * strength * 2);
        y.set(((e.clientY - (r.top + r.height / 2)) / r.height) * strength * 2);
      }}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      whileTap={{ scale: 0.97 }}
      style={{ x: sx, y: sy, ...style }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function Tap({ children, ...rest }: { children: ReactNode } & MotionProps) {
  return (
    <motion.button whileTap={{ scale: 0.97 }} transition={springSoft} {...rest}>
      {children}
    </motion.button>
  );
}

export function Ring({
  value, size = 72, stroke = 7, color = "hsl(var(--primary))", children,
}: {
  value: number; size?: number; stroke?: number; color?: string; children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid place-items-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - value) }}
          transition={{ ...spring, delay: 0.15 }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}

export function StaffBar({ value, h = 7, delay = 0.1 }: { value: number; h?: number; delay?: number }) {
  const col = value >= 1 ? "hsl(var(--ok))" : value < 0.5 ? "hsl(var(--bad))" : "hsl(var(--primary))";
  return (
    <div className="w-full rounded-full overflow-hidden bg-muted" style={{ height: h }}>
      <motion.div
        className="h-full rounded-full"
        style={{ background: col }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, value * 100)}%` }}
        transition={{ ...spring, delay }}
      />
    </div>
  );
}
