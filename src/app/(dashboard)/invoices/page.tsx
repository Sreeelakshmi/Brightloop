import { PlaceholderModule } from "@/components/shared/placeholder-module";

export default function InvoicesPage() {
  return (
    <PlaceholderModule
      title="Invoices & Billing History"
      description="Track generated billing invoices, itemized tax computations, discounts, and payment statuses."
      assignedMember="Member 3 — Billing & Payments"
      branch="feature/billing-payments"
      plannedFeatures={[
        "Searchable invoice ledger with statuses (Draft, Open, Paid, Void, Uncollectible)",
        "Itemized line items with regional tax calculations and coupon discounts",
        "PDF invoice generation, download, and email delivery",
        "Automated recurring invoice generation schedule",
        "Credit notes and refund adjustments",
      ]}
    />
  );
}

