import { listPlans } from "@/lib/services/plans";
import { getCurrentUser } from "@/lib/auth";
import { PlansClient } from "@/components/admin/PlansClient";

export const dynamic = "force-dynamic";

export default async function PlansPage() {
  const user = await getCurrentUser();
  const plans = await listPlans();

  return <PlansClient initialPlans={plans} isAdmin={user?.role === "admin"} />;
}
