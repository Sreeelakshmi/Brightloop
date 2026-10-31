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
        "bg-white border-[1.5px] border-dashed border-[#B9CBB9] rounded-[3px] p-8 sm:p-12 text-center flex flex-col items-center justify-center gap-3",
        className
      )}
    >
      <div className="w-12 h-12 rounded-[2px] bg-[#E4EEE4] border border-[#B9CBB9] flex items-center justify-center text-[#2B302B]">
        <Icon className="w-6 h-6 stroke-[1.5]" />
      </div>

      <div className="max-w-md space-y-1">
        <h3 className="text-base font-bold uppercase tracking-tight text-[#2B302B]">
          {title}
        </h3>
        <p className="text-xs text-[#8A968A] leading-relaxed">
          {description}
        </p>
      </div>

      {actionLabel && onAction && (
        <Button
          variant="default"
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

