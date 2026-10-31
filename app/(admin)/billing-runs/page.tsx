import { listBillingRuns } from "@/lib/services/billing";
import { getCurrentUser } from "@/lib/auth";
import { BillingRunsClient } from "@/components/admin/BillingRunsClient";

export const dynamic = "force-dynamic";

export default async function BillingRunsPage() {
  const user = await getCurrentUser();
  const runs = await listBillingRuns();

  return <BillingRunsClient initialRuns={runs} isAdmin={user?.role === "admin"} />;
}
