import React from "react";
import { getInvoices } from "@/services/invoices";
import { InvoicesClient } from "@/components/billing/invoices-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Invoices | Brightloop",
  description: "Enterprise billing invoice ledger and recurring history.",
};

export default async function InvoicesPage() {
  const invoices = await getInvoices();

  return <InvoicesClient initialInvoices={invoices} />;
}

