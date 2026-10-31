import { PlaceholderModule } from "@/components/shared/placeholder-module";

export default function ProductsPage() {
  return (
    <PlaceholderModule
      title="Products Management"
      description="Define and manage digital products, tiers, feature sets, and service packages."
      assignedMember="Member 1 — Admin & Backend"
      branch="feature/admin-backend"
      plannedFeatures={[
        "Product catalog listing and status overview",
        "Add, update, and archive product entities",
        "Product feature tags and entitlement definitions",
        "Multi-currency price association with Supabase backend",
        "Integration with pricing plan tiers",
      ]}
    />
  );
}
