"use client";

import React, { useState } from "react";
import Link from "next/link";
import { DetailedInvoice, DetailedPayment } from "@/types";
import { formatINR } from "@/lib/billing/math";
import { InvoiceStatusBadge, PaymentStatusBadge } from "./status-badge";
import { RecordPaymentModal } from "./record-payment-modal";
import { updateInvoiceStatusAction } from "@/app/actions/billing";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Printer,
  CreditCard,
  CheckCircle,
  XCircle,
  Building2,
  Calendar,
  Receipt,
  FileCheck,
} from "lucide-react";

interface InvoiceDetailViewProps {
  invoice: DetailedInvoice;
  payments: DetailedPayment[];
}

export function InvoiceDetailView({ invoice, payments }: InvoiceDetailViewProps) {
  const [currentInvoice, setCurrentInvoice] = useState<DetailedInvoice>(invoice);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleStatusChange = async (status: "confirmed" | "cancelled") => {
    setActionError(null);
    const res = await updateInvoiceStatusAction(currentInvoice.id, status);
    if (res.success && res.data) {
      setCurrentInvoice((prev) => ({ ...prev, extendedStatus: res.data.extendedStatus }));
    } else {
      setActionError(res.error || "Failed to update status");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top action bar - Hidden when printing */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/invoices"
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to all invoices
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {currentInvoice.extendedStatus === "draft" && (
            <Button
              onClick={() => handleStatusChange("confirmed")}
              variant="outline"
              size="sm"
              className="text-xs sm:text-sm"
            >
              <CheckCircle className="w-4 h-4 mr-1.5 text-blue-600" />
              Confirm Invoice
            </Button>
          )}

          {currentInvoice.extendedStatus !== "paid" &&
            currentInvoice.extendedStatus !== "cancelled" && (
              <Button
                onClick={() => handleStatusChange("cancelled")}
                variant="outline"
                size="sm"
                className="text-xs sm:text-sm text-destructive hover:bg-destructive/10"
              >
                <XCircle className="w-4 h-4 mr-1.5" />
                Cancel Invoice
              </Button>
            )}

          {currentInvoice.amountDuePaise > 0 &&
            currentInvoice.extendedStatus !== "cancelled" &&
            currentInvoice.extendedStatus !== "draft" && (
              <Button
                onClick={() => setIsPaymentModalOpen(true)}
                size="sm"
                className="text-xs sm:text-sm bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <CreditCard className="w-4 h-4 mr-1.5" />
                Record Payment
              </Button>
            )}

          <Button
            onClick={handlePrint}
            variant="secondary"
            size="sm"
            className="text-xs sm:text-sm flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            Print / PDF
          </Button>
        </div>
      </div>

      {actionError && (
        <div className="p-3 bg-destructive/15 border border-destructive/20 text-destructive text-sm rounded-lg">
          {actionError}
        </div>
      )}

      {/* Printable Invoice Container */}
      <div className="bg-background border border-border rounded-xl shadow-sm overflow-hidden p-6 sm:p-10 print:border-none print:shadow-none print:p-0">
        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b pb-8">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary text-primary-foreground font-black text-xl">
                BL
              </div>
              <span className="text-2xl font-bold tracking-tight">Brightloop</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2 max-w-xs leading-relaxed">
              Brightloop Technologies India Pvt Ltd<br />
              Infopark Phase II, Kochi, Kerala, India — 682042<br />
              <span className="font-medium text-foreground">GSTIN:</span> 32AABCB1234F1Z8<br />
              <span className="font-medium text-foreground">Email:</span> billing@brightloop.io
            </p>
          </div>

          <div className="sm:text-right">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
              TAX INVOICE
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-mono text-foreground">
              {currentInvoice.invoiceNumber}
            </h1>
            <div className="mt-2 inline-block">
              <InvoiceStatusBadge status={currentInvoice.extendedStatus} />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Issued on:{" "}
              {new Date(currentInvoice.issueDate).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Bill To & Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 py-8 border-b text-sm">
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
              Billed To
            </span>
            <h3 className="font-bold text-base text-foreground">{currentInvoice.customerName}</h3>
            <p className="text-muted-foreground text-xs mt-1">{currentInvoice.customerEmail}</p>
            <p className="text-muted-foreground text-xs font-mono mt-0.5">
              Account ID: {currentInvoice.customerId.substring(0, 16)}...
            </p>
          </div>

          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
              Billing Timeline
            </span>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between sm:justify-start sm:gap-4">
                <span className="text-muted-foreground">Due Date:</span>
                <span className="font-semibold text-foreground">
                  {new Date(currentInvoice.dueDate).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              {currentInvoice.periodStart && currentInvoice.periodEnd && (
                <div className="flex justify-between sm:justify-start sm:gap-4">
                  <span className="text-muted-foreground">Period:</span>
                  <span className="font-medium text-foreground">
                    {new Date(currentInvoice.periodStart).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                    })}{" "}
                    —{" "}
                    {new Date(currentInvoice.periodEnd).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
              Payment Status
            </span>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between sm:justify-start sm:gap-4">
                <span className="text-muted-foreground">Currency:</span>
                <span className="font-semibold">INR (₹)</span>
              </div>
              <div className="flex justify-between sm:justify-start sm:gap-4">
                <span className="text-muted-foreground">Settlement:</span>
                <span
                  className={
                    currentInvoice.amountDuePaise === 0
                      ? "text-emerald-600 font-semibold"
                      : "text-foreground font-semibold"
                  }
                >
                  {currentInvoice.amountDuePaise === 0 ? "Fully Paid" : "Unpaid Balance"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Itemized Line Items Table */}
        <div className="py-6">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="font-semibold text-xs uppercase tracking-wider">Item / Description</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider text-center">Qty</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider text-right">Unit Price</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider text-right">Discount</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider text-right">Tax (GST)</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentInvoice.items.map((item, idx) => (
                <TableRow key={item.id || idx}>
                  <TableCell className="font-medium text-sm">
                    {item.description}
                  </TableCell>
                  <TableCell className="text-center font-mono text-sm">{item.quantity}</TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatINR(item.unitPricePaise)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-muted-foreground">
                    {item.discountAmountPaise > 0 ? `-${formatINR(item.discountAmountPaise)}` : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatINR(item.taxAmountPaise)}{" "}
                    <span className="text-xs text-muted-foreground">({item.taxRatePercent}%)</span>
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold text-sm">
                    {formatINR(item.totalAmountPaise)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Financial Summary Breakdown */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-8 pt-4 border-t">
          <div className="text-xs text-muted-foreground max-w-sm space-y-2">
            {currentInvoice.notes && (
              <div>
                <span className="font-semibold text-foreground block">Notes & Terms:</span>
                <p className="mt-0.5">{currentInvoice.notes}</p>
              </div>
            )}
            <p className="text-[11px] leading-relaxed">
              This invoice was electronically generated by the Brightloop Recurring Engine in compliance with
              applicable Indian GST laws. Financial values are mathematically evaluated in integer paise.
            </p>
          </div>

          <div className="w-full sm:w-72 space-y-2 text-sm">
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-mono">{formatINR(currentInvoice.subtotalPaise)}</span>
            </div>

            {currentInvoice.discountTotalPaise > 0 && (
              <div className="flex justify-between py-1 text-emerald-600 dark:text-emerald-400">
                <span>Discount Applied:</span>
                <span className="font-mono">-{formatINR(currentInvoice.discountTotalPaise)}</span>
              </div>
            )}

            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Tax Total (GST):</span>
              <span className="font-mono">{formatINR(currentInvoice.taxTotalPaise)}</span>
            </div>

            <div className="border-t pt-2 flex justify-between font-bold text-base">
              <span>Invoice Total:</span>
              <span className="font-mono text-primary">
                {formatINR(currentInvoice.totalAmountPaise)}
              </span>
            </div>

            <div className="flex justify-between py-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <span>Amount Paid:</span>
              <span className="font-mono">{formatINR(currentInvoice.amountPaidPaise)}</span>
            </div>

            <div className="border-t pt-2 flex justify-between font-bold text-lg">
              <span>Outstanding Balance:</span>
              <span
                className={`font-mono ${
                  currentInvoice.amountDuePaise > 0 ? "text-destructive" : "text-foreground"
                }`}
              >
                {formatINR(currentInvoice.amountDuePaise)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment History Log on this Invoice */}
        {payments.length > 0 && (
          <div className="mt-10 pt-6 border-t print:hidden">
            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              Recorded Payments & Transactions ({payments.length})
            </h4>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="text-xs uppercase">Date</TableHead>
                    <TableHead className="text-xs uppercase">Method</TableHead>
                    <TableHead className="text-xs uppercase">Reference</TableHead>
                    <TableHead className="text-xs uppercase">Notes</TableHead>
                    <TableHead className="text-xs uppercase text-center">Status</TableHead>
                    <TableHead className="text-xs uppercase text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(p.paymentDate).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </TableCell>
                      <TableCell className="text-xs font-medium uppercase">{p.paymentMethod}</TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {p.transactionReference || "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{p.notes || "—"}</TableCell>
                      <TableCell className="text-center">
                        <PaymentStatusBadge status={p.status} />
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold text-xs text-emerald-600 dark:text-emerald-400">
                        {formatINR(p.amountPaise)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <RecordPaymentModal
          invoice={currentInvoice}
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          onSuccess={() => window.location.reload()}
        />
      )}
    </div>
  );
}

