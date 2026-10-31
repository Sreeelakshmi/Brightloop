import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCcw } from "lucide-react";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  errorCode?: string;
  onRetry?: () => void;
  className?: string;
}

/**
 * ErrorState Component
 * Error reporting box with Brightloop orange accent.
 */
export function ErrorState({
  title = "Telemetry Signal Disrupted",
  message = "An error occurred while fetching billing stream telemetry. Please retry.",
  errorCode = "ERR_TELEMETRY_SYNC_FAIL",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "bg-white border border-[#F27B4B] rounded-xl p-6 sm:p-8 flex flex-col items-center text-center max-w-lg mx-auto shadow-sm",
        className
      )}
    >
      <div className="w-12 h-12 rounded-xl bg-[#FDECE5] text-[#F27B4B] flex items-center justify-center mb-3">
        <AlertTriangle className="w-6 h-6 stroke-[2]" />
      </div>

      <div className="text-[10px] font-bold uppercase tracking-widest text-[#F27B4B] mb-1">
        ERROR // {errorCode}
      </div>

      <h3 className="text-base font-bold text-[#1F2622] mb-1">
        {title}
      </h3>

      <p className="text-xs text-[#8C9B8E] leading-relaxed max-w-sm mb-4">
        {message}
      </p>

      {onRetry && (
        <Button
          variant="orange"
          size="sm"
          onClick={onRetry}
          className="text-xs gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Retry
        </Button>
      )}
    </div>
  );
}
