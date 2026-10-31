import React from "react";
import { cn } from "@/lib/utils";
import { Hexagon, LucideIcon } from "lucide-react";

export interface KPICardProps {
  title: string;
  value: string | number;
  description?: string;
  headerVariant?: "dark" | "sage" | "coral" | "default";
  valueVariant?: "default" | "coral" | "dark";
  showHexagon?: boolean;
  icon?: LucideIcon;
  change?: {
    value: string;
    isPositive?: boolean;
  };
  className?: string;
}

export function KPICard({
  title,
  value,
  description,
  headerVariant = "default",
  valueVariant = "default",
  showHexagon = false,
  icon: Icon,
  change,
  className,
}: KPICardProps) {
  const getHeaderClasses = () => {
    switch (headerVariant) {
      case "dark":
        return "bg-brightloop-dark text-white";
      case "coral":
        return "bg-brightloop-coral text-white";
      case "sage":
        return "bg-brightloop-sage text-white";
      default:
        return "bg-brightloop-sage text-white";
    }
  };

  const getValueClasses = () => {
    switch (valueVariant) {
      case "coral":
        return "text-brightloop-coral";
      case "dark":
        return "text-brightloop-text";
      default:
        return headerVariant === "coral"
          ? "text-brightloop-coral"
          : "text-brightloop-text";
    }
  };

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-white shadow-card overflow-hidden transition-all flex flex-col justify-between",
        className
      )}
    >
      {/* Top Colored Header Strip */}
      <div
        className={cn(
          "px-4 py-2 text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center justify-between select-none",
          getHeaderClasses()
        )}
      >
        <span>{title}</span>
        {showHexagon && (
          <Hexagon className="w-3.5 h-3.5 text-white/90 stroke-[2.5]" />
        )}
        {Icon && !showHexagon && <Icon className="w-3.5 h-3.5 text-white/90" />}
      </div>

      {/* Main Body */}
      <div className="p-4 sm:p-5 space-y-1 bg-white">
        <div
          className={cn(
            "text-2xl sm:text-3xl font-extrabold tracking-tight",
            getValueClasses()
          )}
        >
          {value}
        </div>

        {description && (
          <p className="text-xs text-brightloop-sage font-medium">
            {description}
          </p>
        )}

        {change && (
          <div className="pt-1.5 flex items-center gap-1.5 text-xs font-semibold">
            <span
              className={cn(
                "px-1.5 py-0.5 rounded text-[11px]",
                change.isPositive !== false
                  ? "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40"
                  : "text-brightloop-coral bg-brightloop-coral-light"
              )}
            >
              {change.value}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
