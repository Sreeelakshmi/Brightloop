import { PlaceholderModule } from "@/components/shared/placeholder-module";

export default function PlansPage() {
  return (
    <PlaceholderModule
      title="Pricing Plans"
      description="Configure recurring pricing tiers, billing frequencies (monthly/annual), and trial periods."
      assignedMember="Member 1 — Admin & Backend"
      branch="feature/admin-backend"
      plannedFeatures={[
        "Tiered pricing configurations (Starter, Growth, Enterprise)",
        "Billing frequency rules (monthly, quarterly, annual)",
        "Free trial durations and credit card requirements",
        "Feature matrix mapping and usage limit gates",
        "Plan versioning and sunsetting workflows",
      ]}
    />
  );
}
