import { PlaceholderModule } from "@/components/shared/placeholder-module";

export default function SubscriptionsPage() {
  return (
    <PlaceholderModule
      title="Subscription Lifecycle Management"
      description="Orchestrate live customer subscriptions, plan upgrades, downgrades, cancellations, and renewals."
      assignedMember="Member 2 — Subscriptions & Lifecycle"
      branch="feature/subscriptions"
      plannedFeatures={[
        "Active subscriptions registry with filter by status and tier",
        "Subscription lifecycle state machine (Active, Trialing, Past Due, Canceled, Paused)",
        "Upgrade / downgrade prorated scheduling and execution",
        "Automated renewal scheduling and term extension triggers",
        "Cancellation reasons analytics and retention actions",
      ]}
    />
  );
}

