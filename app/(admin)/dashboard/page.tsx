import { PageHeader } from "@/components/ui-shared";

export default function DashboardPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="REVENUE OVERVIEW"
        subtitle="Global Subscription Index"
        logDate="31.10.2026"
        progressSegments={{ charcoal: 58, grey: 28, orange: 14 }}
      />
    </div>
  );
}

