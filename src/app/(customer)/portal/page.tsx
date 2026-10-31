import { PlaceholderModule } from "@/components/shared/placeholder-module";

export default function CustomerPortalPage() {
  return (
    <PlaceholderModule
      title="Customer Self-Service Portal"
      description="Self-service portal where end customers manage their active subscription, view invoices, and update payment methods."
      assignedMember="Member 4 — Dashboard & AI"
      branch="feature/dashboard-ai"
      plannedFeatures={[
        "Customer subscription status and next billing renewal date",
        "Upgrade / downgrade tier self-service options",
        "Historical invoice downloads (PDF)",
        "Credit card and billing address management",
        "Billing support ticket submission",
      ]}
    />
  );
}

