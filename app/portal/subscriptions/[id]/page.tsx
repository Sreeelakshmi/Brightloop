import * as React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
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
  const user = await getCurrentUser();
  const customerId = user?.customerId || "cust-001";

  const subscription = await getMySubscription(params.id, customerId);

  if (!subscription) {
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

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b-[1.5px] border-[#B9CBB9]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-[#2B302B] font-mono">
              {subscription.subscriptionNumber}
            </h1>
            <StatusBadge status={subscription.status} />
          </div>
          <p className="text-xs font-mono text-[#8A968A] mt-1">
            Plan: {subscription.plan?.name || "Enterprise Tier"} • Customer: {subscription.customer?.company || "Account"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#8A968A]">
            LOG: {logDate}
          </span>
        </div>
      </div>

      {/* Horizontal Status Stepper with Hexagon Nodes */}
      <SubscriptionStepper currentStatus={subscription.status} />

      {/* Action Buttons (Renew, Pause, Close - with Plan Permission Gating) */}
      <SubscriptionActionButtons subscription={subscription} />

      {/* Renewal & Billing Information Panel */}
      <RenewalInfoPanel subscription={subscription} />

      {/* Itemized Order Lines Table + Totals Box */}
      <OrderLinesTable subscription={subscription} />

      {/* Associated Invoices History Tab */}
      <SubscriptionInvoicesTab invoices={relevantInvoices} />
    </div>
  );
}
