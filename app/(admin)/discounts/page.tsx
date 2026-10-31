import { listDiscounts } from "@/lib/services/discounts";
import { getCurrentUser } from "@/lib/auth";
import { DiscountsClient } from "@/components/admin/DiscountsClient";

export const dynamic = "force-dynamic";

export default async function DiscountsPage() {
  const user = await getCurrentUser();
  const discounts = await listDiscounts();

  return <DiscountsClient initialDiscounts={discounts} isAdmin={user?.role === "admin"} />;
}
