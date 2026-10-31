import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getMyInvoice, getMyPayments } from "@/lib/data/portal";
import { InvoiceSheet } from "@/components/portal/InvoiceSheet";
import { PageHeader } from "@/components/ui-shared";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface Props {
  params: { id: string };
}

export default async function PortalInvoiceDetailPage({ params }: Props) {
  const user = await requireAuth(["customer"]);
  const customerId = user.customerId!;

  // Security: customerId always from session, never from URL
  const invoice = await getMyInvoice(params.id, customerId);

  // Ownership check – 404 if invoice belongs to a different customer
  if (!invoice || invoice.customerId !== customerId) {
    notFound();
  }

  // Payments for this specific invoice
  const allPayments = await getMyPayments(customerId);
  const invoicePayments = allPayments.filter(
    (p) => p.invoiceId === invoice.id || p.invoiceNo === invoice.invoiceNo
  );

  return (
    <div className="space-y-6">
      {/* Back nav */}
      <Link
        href="/portal/invoices"
        className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#8A968A] hover:text-[#2B302B] transition-colors font-mono"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        BACK TO INVOICES
      </Link>

      <PageHeader
        title={invoice.invoiceNo}
        subtitle="Invoice Detail & Payment History"
        logDate={new Date().toLocaleDateString("en-GB").replace(/\//g, ".")}
        progressSegments={{ charcoal: 70, grey: 20, orange: 10 }}
      />

      <InvoiceSheet invoice={invoice} payments={invoicePayments} />
    </div>
  );
}

