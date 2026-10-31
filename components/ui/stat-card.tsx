import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export type StatCardColor = "charcoal" | "grey-green" | "orange";

export interface StatCardProps {
  label: string;
  value: string | number;
  caption: string;
  color?: StatCardColor;
  icon?: LucideIcon | React.ComponentType<{ className?: string }>;
  highlightValue?: boolean;
  className?: string;
}

const colorMap: Record<
  StatCardColor,
  { barBg: string; barText: string; accentValueText?: string }
> = {
  charcoal: {
    barBg: "bg-[#2B302B]",
    barText: "text-white",
  },
  "grey-green": {
    barBg: "bg-[#8A968A]",
    barText: "text-white",
  },
  orange: {
    barBg: "bg-[#F57B4A]",
    barText: "text-white",
    accentValueText: "text-[#F57B4A]",
  },
};

export function StatCard({
  label,
  value,
  caption,
  color = "grey-green",
  icon: Icon,
  highlightValue = false,
  className,
}: StatCardProps) {
  const scheme = colorMap[color];

  return (
    <div
      className={cn(
        "bg-white border-[1.5px] border-[#B9CBB9] rounded-[3px] overflow-hidden flex flex-col justify-between shadow-none",
        className
      )}
    >
      {/* Top Banner / Bar */}
      <div
        className={cn(
          "px-3.5 py-1.5 flex items-center justify-between transition-colors",
          scheme.barBg,
          scheme.barText
        )}
      >
        <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest font-mono">
          {label}
        </span>
        {Icon ? (
          <Icon className="w-3.5 h-3.5 opacity-90" />
        ) : (
          <span className="w-2 h-2 rounded-[1px] border border-white/60 inline-block" />
        )}
      </div>

      {/* Main Metric & Caption */}
      <div className="p-4 sm:p-5 flex flex-col justify-center gap-1">
        <div
          className={cn(
            "text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-[#2B302B]",
            highlightValue || color === "orange" ? "text-[#F57B4A]" : ""
          )}
        >
          {value}
        </div>
        <div className="text-[11px] sm:text-xs font-medium text-[#8A968A] tracking-normal">
          {caption}
        </div>
      </div>
    </div>
  );
}

