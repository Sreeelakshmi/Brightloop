import * as React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getMySubscription, getMyInvoices } from "@/lib/data/portal";
import { StatusBadge, PageHeader } from "@/components/ui-shared";
import { SubscriptionStepper } from "@/components/portal/SubscriptionStepper";
import { RenewalInfoPanel } from "@/components/portal/RenewalInfoPanel";
import { OrderLinesTable } from "@/components/portal/OrderLinesTable";
import { SubscriptionInvoicesTab } from "@/components/portal/SubscriptionInvoicesTab";
import { SubscriptionActionButtons } from "@/components/portal/SubscriptionActionButtons";
import { ArrowLeft } from "lucide-react";

interface SubscriptionDetailPageProps {
  params: { id: string };
}

export default async function SubscriptionDetailPage({
  params,
}: SubscriptionDetailPageProps) {
  const user = await requireAuth(["customer"]);
  const customerId = user.customerId;

  if (!customerId) {
    notFound();
  }

  const subscription = await getMySubscription(params.id, customerId);

  if (!subscription || subscription.customerId !== customerId) {
    notFound();
  }

  const invoicesResult = await getMyInvoices(customerId, 1, 20);
  const relevantInvoices = invoicesResult.data.filter(
    (i) => !i.subscriptionId || i.subscriptionId === subscription.id
  );

  const logDate = new Date()
    .toLocaleDateString("en-GB")
    .split("/")
    .join(".");

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Navigation Back Link */}
      <div>
        <Link
          href="/portal/subscriptions"
          className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-[#8A968A] hover:text-[#2B302B] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to My Subscriptions
        </Link>
      </div>

      {/* Header with Title and Telemetry Progress Bar */}
      <PageHeader
        title={subscription.subscriptionNumber}
        subtitle={`${subscription.plan?.name || "Standard Plan"} • ${subscription.customer?.name || "Customer"}`}
        logDate={logDate}
        progressSegments={{ charcoal: 60, grey: 30, orange: 10 }}
      />

      {/* 5-Stage Stepper: Draft -> Quotation -> Confirmed -> Active -> Closed */}
      <SubscriptionStepper currentStatus={subscription.status} />

      {/* Renewal Info Panel */}
      <RenewalInfoPanel subscription={subscription} />

      {/* Order Lines Table */}
      <OrderLinesTable subscription={subscription} />

      {/* Associated Invoices Tab */}
      <SubscriptionInvoicesTab invoices={relevantInvoices} />

      {/* Contract Lifecycle Actions */}
      <SubscriptionActionButtons subscription={subscription} />
    </div>
  );
}
