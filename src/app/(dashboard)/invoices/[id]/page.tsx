import React from "react";
import { notFound } from "next/navigation";
import { getInvoiceById } from "@/services/invoices";
import { getPayments } from "@/services/payments";
import { InvoiceDetailView } from "@/components/billing/invoice-detail-view";

interface InvoicePageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: InvoicePageProps) {
  const invoice = await getInvoiceById(params.id);
  if (!invoice) return { title: "Invoice Not Found | Brightloop" };

  return {
    title: `${invoice.invoiceNumber} — ${invoice.customerName} | Brightloop`,
    description: `Tax invoice details for ${invoice.invoiceNumber}`,
  };
}

export default async function InvoiceDetailPage({ params }: InvoicePageProps) {
  const invoice = await getInvoiceById(params.id);
  if (!invoice) {
    notFound();
  }

  const payments = await getPayments({ invoiceId: invoice.id });

  return <InvoiceDetailView invoice={invoice} payments={payments} />;
}

