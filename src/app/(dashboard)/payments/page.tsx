import React from "react";
import { getPayments } from "@/services/payments";
import { getInvoices } from "@/services/invoices";
import { PaymentsClient } from "@/components/billing/payments-client";

export const metadata = {
  title: "Payments | Brightloop",
  description: "Payment transaction ledger and settlement tracking.",
};

export default async function PaymentsPage() {
  const [payments, invoices] = await Promise.all([
    getPayments(),
    getInvoices(),
  ]);

  return <PaymentsClient initialPayments={payments} invoices={invoices} />;
}
