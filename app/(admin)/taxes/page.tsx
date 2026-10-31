import { listTaxes } from "@/lib/services/taxes";
import { getCurrentUser } from "@/lib/auth";
import { TaxesClient } from "@/components/admin/TaxesClient";

export const dynamic = "force-dynamic";

export default async function TaxesPage() {
  const user = await getCurrentUser();
  const taxes = await listTaxes();

  return <TaxesClient initialTaxes={taxes} isAdmin={user?.role === "admin"} />;
}
