import { PlaceholderModule } from "@/components/shared/placeholder-module";

export default function CustomersPage() {
  return (
    <PlaceholderModule
      title="Customer Directory"
      description="Manage customer accounts, business entities, billing contacts, and historical subscriptions."
      assignedMember="Member 1 — Admin & Backend"
      branch="feature/admin-backend"
      plannedFeatures={[
        "Customer accounts list with search and filter capabilities",
        "Customer details view with active subscriptions and lifetime value (LTV)",
        "Billing contact info and tax ID registration",
        "Organization hierarchies and multiple seat assignments",
        "Customer status lifecycle (Lead, Active, Delinquent, Churned)",
      ]}
    />
  );
}

