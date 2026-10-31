import { listInvoices } from "@/lib/services/invoices";
import { getCurrentUser } from "@/lib/auth";
import { InvoicesClient } from "@/components/admin/InvoicesClient";

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  const user = await getCurrentUser();
  const result = await listInvoices({ pageSize: 100 });

  return <InvoicesClient initialInvoices={result.data} isAdmin={user?.role === "admin"} />;
}
