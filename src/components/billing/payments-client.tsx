"use client";

import React, { useState } from "react";
import Link from "next/link";
import { DetailedPayment, DetailedInvoice } from "@/types";
import { formatINR } from "@/lib/billing/math";
import { PaymentStatusBadge } from "./status-badge";
import { RecordPaymentModal } from "./record-payment-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  CreditCard,
  Search,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Receipt,
  Plus,
  ArrowUpRight,
} from "lucide-react";

interface PaymentsClientProps {
  initialPayments: DetailedPayment[];
  invoices: DetailedInvoice[];
}

export function PaymentsClient({ initialPayments, invoices }: PaymentsClientProps) {
  const [payments, setPayments] = useState<DetailedPayment[]>(initialPayments);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedMethod, setSelectedMethod] = useState<string>("all");
  const [isRecordModalOpen, setIsRecordModalOpen] = useState<boolean>(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<DetailedInvoice | null>(
    null
  );

  // Invoices eligible for payment (amountDuePaise > 0 and not draft/cancelled)
  const payableInvoices = invoices.filter(
    (inv) => inv.amountDuePaise > 0 && inv.extendedStatus !== "cancelled" && inv.extendedStatus !== "draft"
  );

  // Financial metrics
  const totalSettledPaise = payments
    .filter((p) => p.status === "succeeded")
    .reduce((acc, p) => acc + p.amountPaise, 0);

  const cardPaymentsCount = payments.filter((p) => p.paymentMethod === "card").length;
  const upiPaymentsCount = payments.filter((p) => p.paymentMethod === "upi").length;
  const bankTransferCount = payments.filter(
    (p) => p.paymentMethod === "bank_transfer" || p.paymentMethod === "net_banking"
  ).length;

  // Filtered payments
  const filteredPayments = payments.filter((p) => {
    if (selectedMethod !== "all" && p.paymentMethod !== selectedMethod) {
      return false;
    }

    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      const matchRef = p.transactionReference?.toLowerCase().includes(q);
      const matchNotes = p.notes?.toLowerCase().includes(q);
      const matchMethod = p.paymentMethod.toLowerCase().includes(q);
      const invoice = invoices.find((inv) => inv.id === p.invoiceId);
      const matchInvoice = invoice?.invoiceNumber.toLowerCase().includes(q);
      const matchCustomer = invoice?.customerName?.toLowerCase().includes(q);
      return matchRef || matchNotes || matchMethod || matchInvoice || matchCustomer;
    }

    return true;
  });

  const handleOpenRecordModal = (invoice?: DetailedInvoice) => {
    if (invoice) {
      setSelectedInvoiceForPayment(invoice);
    } else if (payableInvoices.length > 0) {
      setSelectedInvoiceForPayment(payableInvoices[0]);
    }
    setIsRecordModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-primary" />
            Payments & Transactions
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time transaction settlement ledger, multi-method payment recording, and balance reconciliation.
          </p>
        </div>

        {payableInvoices.length > 0 && (
          <Button
            onClick={() => handleOpenRecordModal()}
            className="flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Record New Payment
          </Button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Total Collections
              </p>
              <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {formatINR(totalSettledPaise)}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {payments.length} verified transactions
              </p>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Card Transactions
              </p>
              <h3 className="text-2xl font-bold text-foreground mt-1">{cardPaymentsCount}</h3>
              <p className="text-xs text-muted-foreground mt-1">Visa, Mastercard & RuPay</p>
            </div>
            <div className="p-3 bg-primary/10 rounded-xl text-primary">
              <CreditCard className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                UPI Transactions
              </p>
              <h3 className="text-2xl font-bold text-foreground mt-1">{upiPaymentsCount}</h3>
              <p className="text-xs text-muted-foreground mt-1">GPay, PhonePe, BHIM</p>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-600 dark:text-purple-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Bank Transfers
              </p>
              <h3 className="text-2xl font-bold text-foreground mt-1">{bankTransferCount}</h3>
              <p className="text-xs text-muted-foreground mt-1">NEFT, RTGS & Net Banking</p>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-400">
              <Receipt className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Method filter pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "All Methods" },
            { id: "card", label: "Cards" },
            { id: "upi", label: "UPI" },
            { id: "net_banking", label: "Net Banking" },
            { id: "bank_transfer", label: "Bank Transfer" },
            { id: "manual", label: "Manual" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedMethod(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                selectedMethod === tab.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search ref #, invoice #, customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* Payments Table */}
      <Card className="border-border overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="text-xs font-semibold uppercase tracking-wider">Date & Time</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider">Reference</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider">Invoice</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider">Customer</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider">Method</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-center">Status</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">Amount (INR)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPayments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="font-medium">No transactions found matching criteria</p>
                  <p className="text-xs mt-1">Try selecting another payment method or clearing the search query.</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredPayments.map((p) => {
                const inv = invoices.find((i) => i.id === p.invoiceId);
                return (
                  <TableRow key={p.id} className="hover:bg-muted/30">
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(p.paymentDate).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-medium">
                      {p.transactionReference || "—"}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {inv ? (
                        <Link
                          href={`/invoices/${inv.id}`}
                          className="text-primary hover:underline flex items-center gap-1 font-semibold"
                        >
                          {inv.invoiceNumber}
                          <ArrowUpRight className="w-3 h-3 opacity-60" />
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">Invoice #{p.invoiceId.substring(0, 8)}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-xs text-foreground">
                        {inv?.customerName || "Customer Account"}
                      </div>
                      <div className="text-[11px] text-muted-foreground">{p.notes || inv?.customerEmail}</div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-foreground uppercase tracking-wide">
                        {p.paymentMethod.replace("_", " ")}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <PaymentStatusBadge status={p.status} />
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                      {formatINR(p.amountPaise)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Modal for recording payment */}
      {isRecordModalOpen && selectedInvoiceForPayment && (
        <RecordPaymentModal
          invoice={selectedInvoiceForPayment}
          isOpen={isRecordModalOpen}
          onClose={() => {
            setIsRecordModalOpen(false);
            setSelectedInvoiceForPayment(null);
          }}
          onSuccess={() => window.location.reload()}
        />
      )}
    </div>
  );
}

