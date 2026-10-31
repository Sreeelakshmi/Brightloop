import { listQuotationTemplates } from "@/lib/services/quotations";
import { listPlans } from "@/lib/services/plans";
import { listProducts } from "@/lib/services/products";
import { getMockDb } from "@/lib/mock/db";
import { getCurrentUser } from "@/lib/auth";
import { QuotationTemplatesClient } from "@/components/admin/QuotationTemplatesClient";

export const dynamic = "force-dynamic";

export default async function QuotationTemplatesPage() {
  const user = await getCurrentUser();
  const db = getMockDb();
  const templates = await listQuotationTemplates();
  const plans = await listPlans();
  const products = await listProducts({ includeArchived: false });
  const customers = db.store.customers.slice(0, 15);

  return (
    <QuotationTemplatesClient
      initialTemplates={templates}
      customers={customers}
      plans={plans}
      products={products}
      isAdmin={user?.role === "admin"}
    />
  );
}
