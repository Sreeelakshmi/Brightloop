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
    bannerBg: "bg-[#2B302B]",
    bannerText: "text-white",
  },
  grey: {
    bannerBg: "bg-[#8A968A]",
    bannerText: "text-white",
  },
  orange: {
    bannerBg: "bg-[#F57B4A]",
    bannerText: "text-white",
    accentValueText: "text-[#F57B4A]",
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
        "bg-white border-[1.5px] border-[#B9CBB9] rounded-[3px] overflow-hidden flex flex-col justify-between shadow-none transition-all",
        onClick && "cursor-pointer hover:border-[#2B302B]",
        className
      )}
    >
      {/* Top Colored Bar / Header */}
      <div
        className={cn(
          "px-3.5 py-1.5 flex items-center justify-between transition-colors",
          style.bannerBg,
          style.bannerText
        )}
      >
        <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest font-mono select-none">
          {label}
        </span>
        {Icon ? (
          <Icon className="w-3.5 h-3.5 opacity-90 shrink-0" />
        ) : (
          <span className="w-2 h-2 rounded-[1px] border border-white/60 inline-block shrink-0" />
        )}
      </div>

      {/* Metric Content */}
      <div className="p-4 sm:p-5 flex flex-col justify-center gap-1">
        <div
          className={cn(
            "text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-[#2B302B] leading-none",
            highlightValue || normalizedVariant === "orange" ? "text-[#F57B4A]" : ""
          )}
        >
          {value}
        </div>
        {caption && (
          <div className="text-[11px] sm:text-xs font-medium text-[#8A968A] tracking-normal mt-1 leading-snug">
            {caption}
          </div>
        )}
      </div>
    </div>
  );
}

