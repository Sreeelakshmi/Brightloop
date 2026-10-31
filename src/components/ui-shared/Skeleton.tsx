import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Base Telemetry Skeleton
 * Subtle light-sage shimmer with rounded-lg edges.
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-[#EBF1EA] border border-[#D5DDD2]/50",
        className
      )}
      {...props}
    />
  );
}

/**
 * StatCardSkeleton
 * Matches the exact shape of Telemetry StatCard with colored top bar simulator.
 */
export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "bg-white border border-[#D5DDD2] rounded-xl overflow-hidden flex flex-col justify-between shadow-sm",
        className
      )}
    >
      <div className="h-8 bg-[#DDE5DB] animate-pulse px-4 flex items-center justify-between">
        <Skeleton className="h-3.5 w-28 bg-[#8C9B8E]/40" />
        <Skeleton className="h-3 w-3 rounded-full bg-[#8C9B8E]/40" />
      </div>
      <div className="p-4 sm:p-5 space-y-2">
        <Skeleton className="h-8 w-3/4 bg-[#EBF1EA]" />
        <Skeleton className="h-3.5 w-1/2 bg-[#EBF1EA]/60" />
      </div>
    </div>
  );
}

/**
 * TableSkeleton
 * Simulates a telemetry data table with header and rows.
 */
export function TableSkeleton({
  rows = 5,
  cols = 6,
  className,
}: {
  rows?: number;
  cols?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "w-full bg-white border border-[#D5DDD2] rounded-xl overflow-hidden shadow-sm",
        className
      )}
    >
      {/* Table Header */}
      <div className="bg-[#DDE5DB] border-b border-[#D5DDD2] p-3 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1 bg-[#8C9B8E]/30" />
        ))}
      </div>

      {/* Table Rows */}
      <div className="divide-y divide-[#D5DDD2]">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="p-3.5 flex gap-4 items-center">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton
                key={c}
                className={cn(
                  "h-4 bg-[#EBF1EA] flex-1",
                  c === 0 && "w-20 flex-none font-mono",
                  c === cols - 1 && "w-16 flex-none"
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * ChartSkeleton
 * Simulates a telemetry chart panel with axes and loading pulse.
 */
export function ChartSkeleton({
  height = "h-64",
  className,
}: {
  height?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-white border border-[#D5DDD2] rounded-xl p-5 flex flex-col justify-between shadow-sm",
        height,
        className
      )}
    >
      <div className="flex justify-between items-center mb-4">
        <Skeleton className="h-4 w-36 bg-[#EBF1EA]" />
        <Skeleton className="h-3 w-16 bg-[#EBF1EA]" />
      </div>
      <div className="flex-1 flex items-end gap-3 pt-6 border-b border-[#D5DDD2]">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton
            key={i}
            className="flex-1 bg-[#EBF1EA] rounded-t-sm"
            style={{ height: `${20 + (i % 4) * 20}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between mt-2 pt-1 text-xs text-[#8C9B8E]">
        <Skeleton className="h-3 w-12 bg-[#EBF1EA]/60" />
        <Skeleton className="h-3 w-12 bg-[#EBF1EA]/60" />
        <Skeleton className="h-3 w-12 bg-[#EBF1EA]/60" />
      </div>
    </div>
  );
}
