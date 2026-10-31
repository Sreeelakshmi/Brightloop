import {
  getRevenueOverTime,
  getSubscriptionsByStatus,
  getPaymentsByMethod,
} from "@/lib/data/dashboard";
import { TelemetryFilters } from "@/types";
import { RevenueChart } from "./RevenueChart";
import { SubscriptionsChart } from "./SubscriptionsChart";
import { PaymentsChart } from "./PaymentsChart";

interface ChartsSectionProps {
  filters: TelemetryFilters;
}

export async function ChartsSection({ filters }: ChartsSectionProps) {
  const [revenueData, subsData, paymentsData] = await Promise.all([
    getRevenueOverTime(filters),
    getSubscriptionsByStatus(filters),
    getPaymentsByMethod(filters),
  ]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
      <RevenueChart data={revenueData} />
      <SubscriptionsChart data={subsData} />
      <PaymentsChart data={paymentsData} />
    </div>
  );
}
