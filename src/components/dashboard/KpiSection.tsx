import { StatCard } from "@/components/ui-shared";
import { getDashboardKpis } from "@/lib/data/dashboard";
import { TelemetryFilters } from "@/types";
import { formatMoney, formatNumber } from "@/lib/formatters";
import { Activity, AlertTriangle, DollarSign, TrendingUp } from "lucide-react";

interface KpiSectionProps {
  filters: TelemetryFilters;
}

export async function KpiSection({ filters }: KpiSectionProps) {
  const kpis = await getDashboardKpis(filters);

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
      <StatCard
        label="Total Revenue"
        value={formatMoney(kpis.totalRevenue)}
        caption="Collected this period"
        variant="charcoal"
        icon={DollarSign}
      />
      <StatCard
        label="Active Subscriptions"
        value={formatNumber(kpis.activeSubscriptions)}
        caption="Currently billing"
        variant="grey"
        icon={Activity}
      />
      <StatCard
        label="Outstanding Payments"
        value={formatMoney(kpis.outstandingPayments)}
        caption="Awaiting payment"
        variant="grey"
        icon={TrendingUp}
      />
      <StatCard
        label="Overdue Invoices"
        value={formatNumber(kpis.overdueInvoices)}
        caption="Needs follow-up"
        variant="orange"
        icon={AlertTriangle}
        highlightValue
      />
    </div>
  );
}
