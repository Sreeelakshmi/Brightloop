import React from "react";
import { cn } from "@/lib/utils";

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  logDate?: string;
  showHexagonMark?: boolean;
  progressSegments?: {
    charcoal?: number; // percentage (e.g. 58)
    grey?: number;     // percentage (e.g. 28)
    orange?: number;   // percentage (e.g. 14)
  };
  children?: React.ReactNode;
  className?: string;
}

/**
 * Single telemetry hexagon symbol
 */
export function HexagonSymbol({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("inline-block text-[#1F2622] shrink-0", className)}
      aria-hidden="true"
    >
      <polygon
        points="12,2 21,7.2 21,16.8 12,22 3,16.8 3,7.2"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

/**
 * PageHeader Component
 * Large heavy title, hexagon mark, subtitle, "LOG: date" tag, and three-segment progress index line.
 */
export function PageHeader({
  title,
  subtitle = "Global Subscription Index",
  logDate = "31.10.2026",
  showHexagonMark = true,
  progressSegments = { charcoal: 58, grey: 28, orange: 14 },
  children,
  className,
}: PageHeaderProps) {
  const charcoalWidth = `${progressSegments.charcoal ?? 58}%`;
  const greyWidth = `${progressSegments.grey ?? 28}%`;
  const orangeWidth = `${progressSegments.orange ?? 14}%`;

  return (
    <div className={cn("space-y-3 mb-6", className)}>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          {/* Primary Huge Title with Hexagon Mark */}
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl sm:text-4xl md:text-[40px] font-black tracking-tight uppercase text-[#1F2622] leading-none">
              {title}
            </h1>
            {showHexagonMark && (
              <HexagonSymbol className="w-5 h-5 sm:w-6 sm:h-6 text-[#1F2622] -mt-0.5" />
            )}
          </div>

          {/* Subtitle & "LOG: date" tag */}
          <div className="flex flex-wrap items-center gap-2.5 mt-2.5">
            {subtitle && (
              <span className="text-sm sm:text-base font-medium text-[#1F2622]">
                {subtitle}
              </span>
            )}
            {logDate && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#DDE5DB] text-[#1F2622] border border-[#D5DDD2] text-[11px] font-mono font-bold tracking-wider">
                <span className="opacity-75">LOG:</span>
                <span>{logDate}</span>
              </span>
            )}
          </div>
        </div>

        {/* Optional Action Controls Slot */}
        {children && <div className="flex items-center gap-2 shrink-0">{children}</div>}
      </div>

      {/* Three-segment progress line matching reference design */}
      <div className="w-full pt-1">
        <div
          className="w-full h-1.5 sm:h-2 rounded-full overflow-hidden flex bg-[#DDE5DB] gap-[1px]"
          role="progressbar"
          aria-label="Subscription telemetry index"
        >
          <div
            style={{ width: charcoalWidth }}
            className="h-full bg-[#1F2622] transition-all duration-300 rounded-l-full"
            title={`Active / Standard: ${charcoalWidth}`}
          />
          <div
            style={{ width: greyWidth }}
            className="h-full bg-[#8C9B8E] transition-all duration-300"
            title={`Secondary / In-flight: ${greyWidth}`}
          />
          <div
            style={{ width: orangeWidth }}
            className="h-full bg-[#F27B4B] transition-all duration-300 rounded-r-full"
            title={`Overdue / Action Needed: ${orangeWidth}`}
          />
        </div>
      </div>
    </div>
  );
}
