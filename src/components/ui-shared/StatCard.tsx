import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export type StatCardVariant = "charcoal" | "grey" | "grey-green" | "orange";

export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  caption?: string;
  variant?: StatCardVariant;
  icon?: LucideIcon | React.ComponentType<{ className?: string }>;
  highlightValue?: boolean;
  className?: string;
  onClick?: () => void;
}

const variantStyles: Record<
  "charcoal" | "grey" | "orange",
  { bannerBg: string; bannerText: string; accentValueText?: string }
> = {
  charcoal: {
    bannerBg: "bg-[#1F2622]",
    bannerText: "text-white",
  },
  grey: {
    bannerBg: "bg-[#8C9B8E]",
    bannerText: "text-white",
  },
  orange: {
    bannerBg: "bg-[#F27B4B]",
    bannerText: "text-white",
    accentValueText: "text-[#F27B4B]",
  },
};

/**
 * StatCard Component
 * Telemetry stat card with white outlined body, thick colored top bar (charcoal | grey | orange),
 * small icon + uppercase label, large bold tabular figure, and small subtext caption.
 */
export function StatCard({
  label,
  value,
  caption,
  variant = "grey",
  icon: Icon,
  highlightValue = false,
  className,
  onClick,
}: StatCardProps) {
  const normalizedVariant = variant === "grey-green" ? "grey" : variant;
  const style = variantStyles[normalizedVariant] || variantStyles.grey;

  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white border border-[#D5DDD2] rounded-xl overflow-hidden flex flex-col justify-between shadow-sm transition-all",
        onClick && "cursor-pointer hover:border-[#1F2622]",
        className
      )}
    >
      {/* Top Colored Bar / Header */}
      <div
        className={cn(
          "px-4 py-2 flex items-center justify-between transition-colors",
          style.bannerBg,
          style.bannerText
        )}
      >
        <span className="text-[11px] font-bold uppercase tracking-widest font-mono select-none">
          {label}
        </span>
        {Icon ? (
          <Icon className="w-3.5 h-3.5 opacity-90 shrink-0" />
        ) : (
          <span className="w-2.5 h-2.5 rounded-[1px] border border-white/70 inline-block shrink-0" />
        )}
      </div>

      {/* Metric Content */}
      <div className="p-4 sm:p-5 flex flex-col justify-center gap-1">
        <div
          className={cn(
            "text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-[#1F2622] leading-none",
            highlightValue || normalizedVariant === "orange" ? "text-[#F27B4B]" : ""
          )}
        >
          {value}
        </div>
        {caption && (
          <div className="text-xs font-medium text-[#8C9B8E] tracking-normal mt-1 leading-snug">
            {caption}
          </div>
        )}
      </div>
    </div>
  );
}
