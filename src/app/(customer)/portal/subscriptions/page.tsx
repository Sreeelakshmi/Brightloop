import * as React from "react";
import { getCurrentUser } from "@/lib/auth";
import { getMySubscriptions } from "@/lib/data/portal";
import { PageHeader, EmptyState } from "@/components/ui-shared";
import { SubscriptionCard } from "@/components/portal/SubscriptionCard";
import { SubscriptionsFilter } from "@/components/portal/SubscriptionsFilter";

interface SubscriptionsPageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

function sp(val: string | string[] | undefined): string | undefined {
  return Array.isArray(val) ? val[0] : val;
}

export default async function PortalSubscriptionsPage({
  searchParams,
}: SubscriptionsPageProps) {
  const user = await getCurrentUser();
  const customerId = user?.customerId || "cust-001";

  const allSubscriptions = await getMySubscriptions(customerId);
  const selectedStatus = sp(searchParams.status) || "all";

  const filteredSubscriptions =
    selectedStatus === "all"
      ? allSubscriptions
      : allSubscriptions.filter(
          (s) => (s.status || "draft").toLowerCase() === selectedStatus.toLowerCase()
        );

  const logDate = new Date()
    .toLocaleDateString("en-GB")
    .split("/")
    .join(".");

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <PageHeader
        title="MY SUBSCRIPTIONS"
        subtitle="Active, Pending & Archived Recurring Service Contracts"
        logDate={logDate}
        progressSegments={{ charcoal: 65, grey: 25, orange: 10 }}
      />

      {/* Status Filter */}
      <div className="flex items-center justify-between">
        <SubscriptionsFilter currentStatus={selectedStatus} />
        <span className="text-xs font-mono text-[#8A968A]">
          Showing{" "}
          <strong className="text-[#2B302B] font-mono">
            {filteredSubscriptions.length}
          </strong>{" "}
          of {allSubscriptions.length}
        </span>
      </div>

      {/* Card Grid */}
      {filteredSubscriptions.length === 0 ? (
        <EmptyState
          title="No Subscriptions Match Status"
          description={`There are no subscriptions with status '${selectedStatus.toUpperCase()}'. Select another filter or reset to ALL.`}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSubscriptions.map((sub) => (
            <SubscriptionCard key={sub.id} subscription={sub} />
          ))}
        </div>
      )}
    </div>
  );
}
