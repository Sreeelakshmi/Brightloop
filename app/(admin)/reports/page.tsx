import { PageHeader } from "@/components/ui-shared";

export default function ReportsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="TELEMETRY REPORTS"
        subtitle="Revenue & Subscription Intelligence"
        logDate="31.10.2026"
        progressSegments={{ charcoal: 64, grey: 26, orange: 10 }}
      />
    </div>
  );
}

