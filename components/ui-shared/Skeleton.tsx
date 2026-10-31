import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Base Telemetry Skeleton
 * Subtle light-sage shimmer with sharp 2-3px edges.
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-[2px] bg-[#D3E3D3]/70 border border-[#B9CBB9]/40",
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
        "bg-white border-[1.5px] border-[#B9CBB9] rounded-[3px] overflow-hidden flex flex-col justify-between",
        className
      )}
    >
      <div className="h-7 bg-[#D3E3D3] animate-pulse px-3.5 flex items-center justify-between">
        <Skeleton className="h-3 w-28 bg-[#8A968A]/40" />
        <Skeleton className="h-3 w-3 rounded-full bg-[#8A968A]/40" />
      </div>
      <div className="p-4 sm:p-5 space-y-2">
        <Skeleton className="h-8 w-3/4 bg-[#D3E3D3]" />
        <Skeleton className="h-3.5 w-1/2 bg-[#D3E3D3]/60" />
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
        "w-full bg-white border-[1.5px] border-[#B9CBB9] rounded-[3px] overflow-hidden",
        className
      )}
    >
      {/* Table Header */}
      <div className="bg-[#D3E3D3] border-b border-[#B9CBB9] p-3 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1 bg-[#8A968A]/40" />
        ))}
      </div>

      {/* Table Rows */}
      <div className="divide-y divide-[#B9CBB9]/60">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="p-3.5 flex gap-4 items-center">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton
                key={c}
                className={cn(
                  "h-4 bg-[#D3E3D3]/50 flex-1",
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
        "bg-white border-[1.5px] border-[#B9CBB9] rounded-[3px] p-5 flex flex-col justify-between",
        height,
        className
      )}
    >
      <div className="flex justify-between items-center mb-4">
        <Skeleton className="h-4 w-36 bg-[#D3E3D3]" />
        <Skeleton className="h-3 w-16 bg-[#D3E3D3]" />
      </div>
      <div className="flex-1 flex items-end gap-3 pt-6 border-b border-[#B9CBB9]">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton
            key={i}
            className="flex-1 bg-[#D3E3D3]/80 rounded-t-[2px]"
            style={{ height: `${20 + (i % 4) * 20}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between mt-2 pt-1 text-[10px] text-[#8A968A]">
        <Skeleton className="h-3 w-12 bg-[#D3E3D3]/60" />
        <Skeleton className="h-3 w-12 bg-[#D3E3D3]/60" />
        <Skeleton className="h-3 w-12 bg-[#D3E3D3]/60" />
      </div>
    </div>
  );
}

