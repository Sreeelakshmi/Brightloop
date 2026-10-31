import { PlaceholderModule } from "@/components/shared/placeholder-module";

export default function DashboardPage() {
  return (
    <PlaceholderModule
      title="Executive Dashboard & Analytics"
      description="Central intelligence hub for recurring revenue metrics, churn tracking, and AI-driven growth forecasting."
      assignedMember="Member 4 — Dashboard & AI"
      branch="feature/dashboard-ai"
      plannedFeatures={[
        "Monthly Recurring Revenue (MRR) & Annual Recurring Revenue (ARR) KPI cards",
        "Interactive revenue trajectory and churn breakdown charts (Recharts)",
        "Subscriber growth metrics and cohort analysis",
        "Gemini AI revenue copilot for conversational forecasting and anomalies",
        "Recent subscription activities and audit logs",
        "Quick action shortcuts for common operations",
      ]}
    />
  );
}
