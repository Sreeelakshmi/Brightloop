import * as React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/ui-shared";
import { InvoiceSheet } from "@/components/portal/InvoiceSheet";
import { getPortalInvoiceById, getCustomerPayments } from "@/lib/data/portal";

interface PageProps {
  params: { id: string };
}

export const dynamic = "force-dynamic";

/**
 * Customer Portal — Invoice Detail Page
 * Shows the printable/downloadable invoice sheet, order lines, and payment log.
 */
export default async function PortalInvoiceDetailPage({ params }: PageProps) {
  // Demo customer session
  const customerId = "cust-001";

  const [invoice, allPayments] = await Promise.all([
    getPortalInvoiceById(params.id, customerId),
    getCustomerPayments(customerId),
  ]);

  if (!invoice) {
    notFound();
  }

  // Filter payments associated with this invoice
  const invoicePayments = allPayments.filter((p) => p.invoiceId === invoice.id);

  return (
    <div className="space-y-6">
      {/* Back nav */}
      <Link
        href="/portal/invoices"
        className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#8C9B8E] hover:text-[#1F2622] transition-colors font-mono"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        BACK TO INVOICES
      </Link>

      <PageHeader
        title={invoice.invoiceNo || invoice.invoiceNumber || "Invoice"}
        subtitle="Invoice Detail & Payment History"
        logDate={new Date().toLocaleDateString("en-GB").replace(/\//g, ".")}
        progressSegments={{ charcoal: 70, grey: 20, orange: 10 }}
      />

      <InvoiceSheet invoice={invoice} payments={invoicePayments} />
    </div>
  );
}
