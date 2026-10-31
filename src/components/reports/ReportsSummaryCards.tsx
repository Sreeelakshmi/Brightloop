import * as React from "react";
import { StatCard } from "@/components/ui-shared";
import { getReportSummary } from "@/lib/data/dashboard";
import { ReportTab, TelemetryFilters } from "@/types";

interface ReportsSummaryCardsProps {
  tab: ReportTab;
  filters: TelemetryFilters;
}

export async function ReportsSummaryCards({ tab, filters }: ReportsSummaryCardsProps) {
  const summary = await getReportSummary(tab, filters);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
      <StatCard
        label={summary.stat1.label}
        value={summary.stat1.value}
        caption={summary.stat1.caption}
        variant={summary.stat1.variant}
      />
      <StatCard
        label={summary.stat2.label}
        value={summary.stat2.value}
        caption={summary.stat2.caption}
        variant={summary.stat2.variant}
      />
      <StatCard
        label={summary.stat3.label}
        value={summary.stat3.value}
        caption={summary.stat3.caption}
        variant={summary.stat3.variant}
        highlightValue={summary.stat3.variant === "orange"}
      />
    </div>
  );
}

export function ReportsSummarySkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white border border-[#D5DDD2] rounded-xl overflow-hidden flex flex-col justify-between shadow-sm"
        >
          <div className="h-8 bg-[#DDE5DB] animate-pulse px-4 flex items-center justify-between">
            <div className="h-3.5 w-28 bg-[#8C9B8E]/40 rounded-sm" />
          </div>
          <div className="p-4 sm:p-5 space-y-2">
            <div className="h-8 w-3/4 bg-[#EBF1EA] animate-pulse rounded-lg" />
            <div className="h-3.5 w-1/2 bg-[#EBF1EA]/60 animate-pulse rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}
