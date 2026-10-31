import { notFound } from "next/navigation";
import { getInvoiceById } from "@/lib/services/invoices";
import { listPayments } from "@/lib/services/payments";
import { getCurrentUser } from "@/lib/auth";
import { InvoiceDetailClient } from "@/components/admin/InvoiceDetailClient";

export const dynamic = "force-dynamic";

interface InvoiceDetailPageProps {
  params: {
    id: string;
  };
}

export default async function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const user = await getCurrentUser();
  const invoice = await getInvoiceById(params.id);

  if (!invoice) {
    notFound();
  }

  const paymentsResult = await listPayments({ invoiceId: invoice.id });

  return (
    <InvoiceDetailClient
      initialInvoice={invoice}
      payments={paymentsResult.data}
      isAdmin={user?.role === "admin"}
    />
  );
}
