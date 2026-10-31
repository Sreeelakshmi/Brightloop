"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { DetailedInvoice, ExtendedInvoiceStatus } from "@/types";
import { formatINR } from "@/lib/billing/math";
import { InvoiceStatusBadge } from "./status-badge";
import { RecordPaymentModal } from "./record-payment-modal";
import { CreateInvoiceModal } from "./create-invoice-modal";
import { runRecurringBillingAction } from "@/app/actions/billing";
import { Input } from "@/components/ui/input";
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
  Search,
  Receipt,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RotateCw,
  Eye,
  CreditCard,
  PlusCircle,
  FileText,
} from "lucide-react";

interface InvoicesClientProps {
  initialInvoices: DetailedInvoice[];
}

export function InvoicesClient({ initialInvoices }: InvoicesClientProps) {
  const [invoices, setInvoices] = useState<DetailedInvoice[]>(initialInvoices);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [activePaymentInvoice, setActivePaymentInvoice] = useState<DetailedInvoice | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  const [isPending, startTransition] = useTransition();
  const [billingResultMsg, setBillingResultMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Compute metrics
  const totalRevenuePaise = invoices
    .filter((i) => i.extendedStatus !== "cancelled")
    .reduce((acc, i) => acc + i.totalAmountPaise, 0);

  const totalCollectedPaise = invoices
    .filter((i) => i.extendedStatus !== "cancelled")
    .reduce((acc, i) => acc + i.amountPaidPaise, 0);

  const totalOutstandingPaise = invoices
    .filter((i) => i.extendedStatus !== "cancelled")
    .reduce((acc, i) => acc + i.amountDuePaise, 0);

  const overdueCount = invoices.filter((i) => i.extendedStatus === "overdue").length;

  // Filter invoices
  const filteredInvoices = invoices.filter((inv) => {
    // Status filter
    if (selectedStatus !== "all" && inv.extendedStatus.toLowerCase() !== selectedStatus.toLowerCase()) {
      return false;
    }

    // Search query
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      const matchNumber = inv.invoiceNumber.toLowerCase().includes(q);
      const matchCustomer = inv.customerName?.toLowerCase().includes(q);
      const matchEmail = inv.customerEmail?.toLowerCase().includes(q);
      return matchNumber || matchCustomer || matchEmail;
    }

    return true;
  });

  const handleRunRecurringBilling = () => {
    setBillingResultMsg(null);
    startTransition(async () => {
      const res = await runRecurringBillingAction();
      if (res.success && res.data) {
        setBillingResultMsg({
          type: "success",
          text: `Recurring billing completed: Processed ${res.data.processedCount} subscription(s), created ${res.data.invoicesCreated.length} invoice(s), skipped ${res.data.skippedDuplicateCount} existing period(s).`,
        });
        if (res.data.invoicesCreated.length > 0) {
          setInvoices((prev) => [...res.data.invoicesCreated, ...prev]);
        }
      } else {
        setBillingResultMsg({
          type: "error",
          text: res.error || "Failed to execute recurring billing.",
        });
      }
    });
  };

  const handlePaymentSuccess = () => {
    // Refresh local invoices or trigger revalidation
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Receipt className="w-7 h-7 text-primary" />
            Invoices & Billing History
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage customer invoices, itemized tax computations, discounts, and payment reconciliations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 text-xs sm:text-sm bg-primary text-primary-foreground shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            Create Invoice
          </Button>

          <Button
            onClick={handleRunRecurringBilling}
            disabled={isPending}
            variant="outline"
            className="border-primary/20 hover:bg-primary/5 text-primary flex items-center gap-2 text-xs sm:text-sm"
          >
            <RotateCw className={`w-4 h-4 ${isPending ? "animate-spin text-primary" : ""}`} />
            <span>{isPending ? "Running Engine..." : "Run Recurring Billing"}</span>
          </Button>

          <Link href="/settings/billing">
            <Button variant="secondary" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <FileText className="w-4 h-4" />
              Tax & Discounts
            </Button>
          </Link>
        </div>
      </div>

      {/* Billing Result Banner */}
      {billingResultMsg && (
        <div
          className={`p-4 rounded-xl border text-sm flex items-center justify-between ${
            billingResultMsg.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
              : "bg-destructive/10 border-destructive/30 text-destructive"
          }`}
        >
          <span>{billingResultMsg.text}</span>
          <button
            onClick={() => setBillingResultMsg(null)}
            className="text-xs underline font-medium hover:opacity-80 ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Total Invoiced
              </p>
              <h3 className="text-2xl font-bold text-foreground mt-1">
                {formatINR(totalRevenuePaise)}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {invoices.length} total generated invoices
              </p>
            </div>
            <div className="p-3 bg-primary/10 rounded-xl text-primary">
              <Receipt className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Total Collected
              </p>
              <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {formatINR(totalCollectedPaise)}
              </h3>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                {totalRevenuePaise > 0
                  ? `${((totalCollectedPaise / totalRevenuePaise) * 100).toFixed(1)}% collection rate`
                  : "0%"}
              </p>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Outstanding Balance
              </p>
              <h3 className="text-2xl font-bold text-foreground mt-1">
                {formatINR(totalOutstandingPaise)}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Pending incoming settlements</p>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-400">
              <Clock className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Overdue Invoices
              </p>
              <h3 className="text-2xl font-bold text-destructive mt-1">{overdueCount}</h3>
              <p className="text-xs text-destructive mt-1 font-medium">Action required</p>
            </div>
            <div className="p-3 bg-destructive/10 rounded-xl text-destructive">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "All Invoices" },
            { id: "confirmed", label: "Confirmed" },
            { id: "paid", label: "Paid" },
            { id: "overdue", label: "Overdue" },
            { id: "draft", label: "Draft" },
            { id: "cancelled", label: "Cancelled" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                selectedStatus === tab.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search invoice #, customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* Invoices Table */}
      <Card className="border-border overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Invoice</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Customer</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Issue Date</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Due Date</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider text-right">
                Total
              </TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider text-right">
                Paid
              </TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider text-right">
                Balance Due
              </TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider text-center">
                Status
              </TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                  <Receipt className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="font-medium">No invoices found matching criteria</p>
                  <p className="text-xs mt-1">Try adjusting your filters or search query.</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices.map((inv) => (
                <TableRow key={inv.id} className="hover:bg-muted/30">
                  <TableCell className="font-mono font-medium text-xs">
                    <Link
                      href={`/invoices/${inv.id}`}
                      className="text-primary hover:underline flex items-center gap-1 font-semibold"
                    >
                      {inv.invoiceNumber}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-sm text-foreground">{inv.customerName}</div>
                    <div className="text-xs text-muted-foreground">{inv.customerEmail}</div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(inv.issueDate).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="text-xs">
                    <span
                      className={
                        inv.extendedStatus === "overdue"
                          ? "text-destructive font-semibold"
                          : "text-muted-foreground"
                      }
                    >
                      {new Date(inv.dueDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium text-sm">
                    {formatINR(inv.totalAmountPaise)}
                  </TableCell>
                  <TableCell className="text-right text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    {formatINR(inv.amountPaidPaise)}
                  </TableCell>
                  <TableCell className="text-right font-bold text-sm">
                    {inv.amountDuePaise > 0 ? (
                      <span className="text-foreground">{formatINR(inv.amountDuePaise)}</span>
                    ) : (
                      <span className="text-muted-foreground font-normal">₹0.00</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <InvoiceStatusBadge status={inv.extendedStatus} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link href={`/invoices/${inv.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          View
                        </Button>
                      </Link>

                      {inv.amountDuePaise > 0 &&
                        inv.extendedStatus !== "cancelled" &&
                        inv.extendedStatus !== "draft" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2 text-xs border-primary/20 text-primary hover:bg-primary/5"
                            onClick={() => setActivePaymentInvoice(inv)}
                          >
                            <CreditCard className="w-3.5 h-3.5 mr-1" />
                            Pay
                          </Button>
                        )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Payment Recording Modal */}
      {activePaymentInvoice && (
        <RecordPaymentModal
          invoice={activePaymentInvoice}
          isOpen={true}
          onClose={() => setActivePaymentInvoice(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {/* Manual Invoice Creation Modal */}
      {isCreateModalOpen && (
        <CreateInvoiceModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}

