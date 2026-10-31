import * as React from "react";
import { getReportRows } from "@/lib/data/dashboard";
import { ReportTab, SortParams, TelemetryFilters } from "@/types";
import { ReportsTable } from "./ReportsTable";
import { TableSkeleton } from "@/components/ui-shared";

interface ReportsDataSectionProps {
  tab: ReportTab;
  filters: TelemetryFilters;
  page: number;
  sort: SortParams;
}

export async function ReportsDataSection({
  tab,
  filters,
  page,
  sort,
}: ReportsDataSectionProps) {
  const result = await getReportRows(tab, filters, page, sort, 10);

  return (
    <ReportsTable
      tab={tab}
      data={result.data}
      total={result.total}
      page={result.page}
      pageSize={result.pageSize}
    />
  );
}

export function ReportsTableSkeleton() {
  return (
    <div className="space-y-3">
      <TableSkeleton rows={10} cols={7} />
    </div>
  );
}
