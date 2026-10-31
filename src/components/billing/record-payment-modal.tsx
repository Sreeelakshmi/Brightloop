"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DetailedInvoice } from "@/types";
import { formatINR, paiseToRupees } from "@/lib/billing/math";
import { recordPaymentAction } from "@/app/actions/billing";
import { CreditCard, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface RecordPaymentModalProps {
  invoice: DetailedInvoice;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function RecordPaymentModal({
  invoice,
  isOpen,
  onClose,
  onSuccess,
}: RecordPaymentModalProps) {
  const maxDueRupees = paiseToRupees(invoice.amountDuePaise);

  const [amountRupees, setAmountRupees] = useState<number>(maxDueRupees);
  const [paymentMethod, setPaymentMethod] = useState<string>("card");
  const [transactionRef, setTransactionRef] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (isNaN(amountRupees) || amountRupees <= 0) {
      setErrorMsg("Please enter a valid payment amount greater than zero.");
      return;
    }

    if (amountRupees > maxDueRupees) {
      setErrorMsg(
        `Overpayment rejected! Payment amount (${formatINR(
          amountRupees * 100
        )}) cannot exceed outstanding balance (${formatINR(invoice.amountDuePaise)}).`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await recordPaymentAction({
        invoiceId: invoice.id,
        customerId: invoice.customerId,
        amountRupees,
        paymentMethod: paymentMethod as any,
        transactionReference: transactionRef || undefined,
        notes: notes || undefined,
      });

      if (!res.success) {
        setErrorMsg(res.error || "Failed to record payment.");
      } else {
        setSuccessMsg("Payment recorded successfully!");
        setTimeout(() => {
          onClose();
          if (onSuccess) onSuccess();
        }, 1200);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-background border border-border w-full max-w-lg rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4 bg-muted/30">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Record Payment</h3>
              <p className="text-xs text-muted-foreground">
                Invoice {invoice.invoiceNumber} • {invoice.customerName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Balance Card */}
        <div className="px-6 py-4 bg-muted/10 border-b flex justify-between items-center text-sm">
          <div>
            <span className="text-muted-foreground text-xs block">Invoice Total</span>
            <span className="font-medium text-foreground">
              {formatINR(invoice.totalAmountPaise)}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground text-xs block">Already Paid</span>
            <span className="font-medium text-emerald-600 dark:text-emerald-400">
              {formatINR(invoice.amountPaidPaise)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-muted-foreground text-xs block font-semibold text-primary">
              Outstanding Balance
            </span>
            <span className="text-lg font-bold text-foreground">
              {formatINR(invoice.amountDuePaise)}
            </span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-destructive/15 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Payment Amount */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-sm font-medium">Payment Amount (INR)</label>
              <button
                type="button"
                onClick={() => setAmountRupees(maxDueRupees)}
                className="text-xs text-primary hover:underline font-medium"
              >
                Pay Full Balance ({formatINR(invoice.amountDuePaise)})
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">
                ₹
              </span>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                max={maxDueRupees}
                value={amountRupees}
                onChange={(e) => setAmountRupees(parseFloat(e.target.value) || 0)}
                className="pl-8 text-base font-semibold"
                placeholder="0.00"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Supports full or partial payment. Overpayment is strictly rejected.
            </p>
          </div>

          {/* Payment Method */}
          <div>
            <label className="text-sm font-medium block mb-1.5">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="card">Credit / Debit Card</option>
              <option value="upi">UPI (GPay / PhonePe / BHIM)</option>
              <option value="net_banking">Net Banking</option>
              <option value="bank_transfer">Direct Bank Transfer (NEFT / RTGS)</option>
              <option value="manual">Manual Cheque / Cash</option>
            </select>
          </div>

          {/* Transaction Reference */}
          <div>
            <label className="text-sm font-medium block mb-1.5">
              Transaction Reference <span className="text-xs text-muted-foreground">(Optional)</span>
            </label>
            <Input
              type="text"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              placeholder="e.g. UPI_RR_981245 or NEFT_HDFC_00192"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium block mb-1.5">
              Notes <span className="text-xs text-muted-foreground">(Optional)</span>
            </label>
            <Input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. First tranche of monthly enterprise retainer"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || amountRupees <= 0}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Recording...
                </>
              ) : (
                `Record Payment ${amountRupees > 0 ? `(₹${amountRupees.toFixed(2)})` : ""}`
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

