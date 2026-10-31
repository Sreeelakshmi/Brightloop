import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FolderSearch, LucideIcon } from "lucide-react";

export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: LucideIcon | React.ComponentType<{ className?: string }>;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  children?: React.ReactNode;
}

/**
 * EmptyState Component
 * Telemetry-styled empty state indicator for tables, search results, or zero-data screens.
 */
export function EmptyState({
  title = "No Records Found",
  description = "No telemetry entries match the specified parameters or date window.",
  icon: Icon = FolderSearch,
  actionLabel,
  onAction,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "bg-white border border-dashed border-[#D5DDD2] rounded-xl p-8 sm:p-12 text-center flex flex-col items-center justify-center gap-3 shadow-sm",
        className
      )}
    >
      <div className="w-12 h-12 rounded-xl bg-[#EBF1EA] border border-[#D5DDD2] flex items-center justify-center text-[#1F2622]">
        <Icon className="w-6 h-6 stroke-[1.5]" />
      </div>

      <div className="max-w-md space-y-1">
        <h3 className="text-base font-bold uppercase tracking-tight text-[#1F2622]">
          {title}
        </h3>
        <p className="text-xs text-[#8C9B8E] leading-relaxed">
          {description}
        </p>
      </div>

      {actionLabel && onAction && (
        <Button
          variant="dark"
          size="sm"
          onClick={onAction}
          className="mt-2 text-xs"
        >
          {actionLabel}
        </Button>
      )}

      {children}
    </div>
  );
}
