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
 * Telemetry-styled error reporting box with single accent orange highlights.
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
        "bg-white border-[1.5px] border-[#F57B4A] rounded-[3px] p-6 sm:p-8 flex flex-col items-center text-center max-w-lg mx-auto shadow-none",
        className
      )}
    >
      <div className="w-11 h-11 rounded-[2px] bg-[#F57B4A] text-white flex items-center justify-center mb-3">
        <AlertTriangle className="w-6 h-6 stroke-[2]" />
      </div>

      <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#F57B4A] mb-1">
        SYSTEM FAULT // {errorCode}
      </div>

      <h3 className="text-base font-bold uppercase tracking-tight text-[#2B302B] mb-1">
        {title}
      </h3>

      <p className="text-xs text-[#8A968A] leading-relaxed max-w-sm mb-4">
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
          Retry Connection
        </Button>
      )}
    </div>
  );
}

