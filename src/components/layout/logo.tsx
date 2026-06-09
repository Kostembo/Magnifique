import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  light?: boolean;
  className?: string;
}

export function MagnifiqueLogo({ size = "md", light = false, className }: LogoProps) {
  const heights = { sm: 32, md: 48, lg: 72, xl: 96 };
  const h = heights[size];

  return (
    <div className={cn("flex items-center", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={light ? "/api/logo?v=light" : "/api/logo?v=dark"}
        alt="Magnifique"
        style={{ height: h, width: "auto" }}
      />
    </div>
  );
}
