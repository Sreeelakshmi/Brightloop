import { listSubscriptions } from "@/lib/services/subscriptions";
import { listPlans } from "@/lib/services/plans";
import { listProducts } from "@/lib/services/products";
import { getMockDb } from "@/lib/mock/db";
import { getCurrentUser } from "@/lib/auth";
import { SubscriptionsClient } from "@/components/admin/SubscriptionsClient";

export const dynamic = "force-dynamic";

export default async function SubscriptionsPage() {
  const user = await getCurrentUser();
  const db = getMockDb();
  const result = await listSubscriptions({ pageSize: 50 });
  const plans = await listPlans();
  const products = await listProducts({ includeArchived: false });
  const customers = db.store.customers.slice(0, 20);

  return (
    <SubscriptionsClient
      initialSubscriptions={result.data}
      total={result.total}
      page={result.page}
      pageSize={result.pageSize}
      customers={customers}
      plans={plans}
      products={products}
      isAdmin={user?.role === "admin"}
    />
  );
}
