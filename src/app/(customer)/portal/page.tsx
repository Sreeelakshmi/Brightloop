import * as React from "react";
import { getCurrentUser } from "@/lib/auth";
import { getMySubscriptions, getMyInvoices } from "@/lib/data/portal";
import { StatCard, PageHeader } from "@/components/ui-shared";
import { formatMoney, formatDate, formatNumber } from "@/lib/formatters";
import { UpcomingRenewalsTimeline } from "@/components/portal/UpcomingRenewalsTimeline";
import { RecentInvoicesTable } from "@/components/portal/RecentInvoicesTable";
import { Activity, Calendar, AlertTriangle, CheckCircle2 } from "lucide-react";

export default async function PortalOverviewPage() {
  const user = await getCurrentUser();
  const customerId = user?.customerId || "cust-001";
  const customerName = user?.name || "Valued Customer";

  // Fetch customer subscriptions and invoices
  const [subscriptions, invoicesResult] = await Promise.all([
    getMySubscriptions(customerId),
    getMyInvoices(customerId, 1, 10),
  ]);

  const invoices = invoicesResult.data;

  // 1. ACTIVE SUBSCRIPTIONS
  const activeSubs = subscriptions.filter((s) => s.status === "active");
  const activeSubsCount = activeSubs.length;

  // 2. OUTSTANDING BALANCE
  const outstandingBalance = invoices.reduce((sum, inv) => sum + (inv.balance || 0), 0);

  // 3. NEXT PAYMENT DUE
  // Look for the nearest unpaid invoice with a due date, or the next subscription renewal
  const unpaidInvoices = invoices
    .filter((inv) => (inv.balance ?? 0) > 0)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  let nextDueLabel = "No payment due";
  let nextDueCaption = "All accounts current";
  if (unpaidInvoices.length > 0) {
    const nextInv = unpaidInvoices[0];
    nextDueLabel = formatDate(nextInv.dueDate, "short");
    nextDueCaption = `${formatMoney(nextInv.balance ?? 0)} due on ${formatDate(nextInv.dueDate)}`;
  } else if (activeSubs.length > 0) {
    const sortedByRenewal = [...activeSubs].sort(
      (a, b) =>
        new Date(a.renewalDate || a.endDate || a.startDate).getTime() -
        new Date(b.renewalDate || b.endDate || b.startDate).getTime()
    );
    const nextSub = sortedByRenewal[0];
    const renewal = nextSub.renewalDate || nextSub.endDate || nextSub.startDate;
    nextDueLabel = formatDate(renewal, "short");
    nextDueCaption = `${formatMoney(nextSub.totalAmount ?? 0)} renewal due`;
  }

  const logDate = new Date()
    .toLocaleDateString("en-GB")
    .split("/")
    .join(".");

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <PageHeader
        title={`HELLO, ${customerName.toUpperCase()}`}
        subtitle="Customer Self-Service & Subscription Management Console"
        logDate={logDate}
        progressSegments={{ charcoal: 60, grey: 30, orange: 10 }}
      />

      {/* Three Telemetry StatCards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="ACTIVE SUBSCRIPTIONS"
          value={formatNumber(activeSubsCount)}
          caption={`${subscriptions.length} total contracts`}
          variant="charcoal"
          icon={Activity}
        />
        <StatCard
          label="NEXT PAYMENT DUE"
          value={nextDueLabel}
          caption={nextDueCaption}
          variant="grey"
          icon={Calendar}
        />
        <StatCard
          label="OUTSTANDING BALANCE"
          value={formatMoney(outstandingBalance)}
          caption={
            outstandingBalance > 0
              ? "Immediate settlement required"
              : "All invoices settled in full"
          }
          variant={outstandingBalance > 0 ? "orange" : "grey"}
          highlightValue={outstandingBalance > 0}
          icon={outstandingBalance > 0 ? AlertTriangle : CheckCircle2}
        />
      </div>

      {/* Two Column Layout: Upcoming Renewals Timeline + Recent Invoices Mini Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <UpcomingRenewalsTimeline subscriptions={subscriptions} />
        <RecentInvoicesTable invoices={invoices} />
      </div>
    </div>
  );
}
