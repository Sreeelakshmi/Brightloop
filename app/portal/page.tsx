import { PageHeader } from "@/components/ui-shared";

export default function PortalOverviewPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="CUSTOMER PORTAL"
        subtitle="Self-Service Subscription & Invoice Console"
        logDate="31.10.2026"
        progressSegments={{ charcoal: 70, grey: 20, orange: 10 }}
      />
    </div>
  );
}

