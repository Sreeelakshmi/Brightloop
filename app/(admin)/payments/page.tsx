import { listPayments } from "@/lib/services/payments";
import { listInvoices } from "@/lib/services/invoices";
import { getCurrentUser } from "@/lib/auth";
import { PaymentsClient } from "@/components/admin/PaymentsClient";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const user = await getCurrentUser();
  const paymentsResult = await listPayments({ pageSize: 100 });
  const invoicesResult = await listInvoices({ pageSize: 200 });
  const unpaidInvoices = invoicesResult.data.filter((i) => i.balance > 0 && i.status !== "cancelled");

  return (
    <PaymentsClient
      initialPayments={paymentsResult.data}
      unpaidInvoices={unpaidInvoices}
      isAdmin={user?.role === "admin"}
    />
  );
}
