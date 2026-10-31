import { getOverdueInvoices } from "@/lib/data/dashboard";
import { TelemetryFilters, SortParams } from "@/types";
import { OverdueTable } from "./OverdueTable";

interface OverdueSectionProps {
  filters: TelemetryFilters;
  page: number;
  sort: SortParams;
}

export async function OverdueSection({ filters, page, sort }: OverdueSectionProps) {
  const result = await getOverdueInvoices(filters, page, sort);

  return (
    <div className="space-y-3">
      {/* Section label */}
      <div className="text-[10px] font-bold uppercase tracking-widest text-[#2B302B] font-mono">
        Overdue Invoices
      </div>
      <OverdueTable
        data={result.data}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
      />
    </div>
  );
}

