import { PlaceholderModule } from "@/components/shared/placeholder-module";

export default function QuotationsPage() {
  return (
    <PlaceholderModule
      title="Sales Quotations & Proposals"
      description="Create custom enterprise quotations, discount structures, quote approvals, and conversion to active contracts."
      assignedMember="Member 2 — Subscriptions & Lifecycle"
      branch="feature/subscriptions"
      plannedFeatures={[
        "Quote builder with itemized plans, add-ons, and customized terms",
        "Configurable quote expiration dates and approval workflows",
        "Quote status tracker (Draft, Sent, Accepted, Expired, Rejected)",
        "One-click conversion from accepted quotation to active subscription",
        "PDF quote preview and customer sharing link generation",
      ]}
    />
  );
}

