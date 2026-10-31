"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/billing/math";
import {
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  ArrowRight,
  RotateCcw,
  ShieldCheck,
  Receipt,
  AlertTriangle,
} from "lucide-react";

interface PaymentResultProps {
  success: boolean;
  amountRupees: number;
  transactionReference: string;
  paymentMethod: string;
  remainingDuePaise: number;
  errorMessage?: string;
  invoiceNumber: string;
  customerName?: string;
  onRetry: () => void;
  onClose: () => void;
}

export function PaymentResult({
  success,
  amountRupees,
  transactionReference,
  paymentMethod,
  remainingDuePaise,
  errorMessage,
  invoiceNumber,
  customerName,
  onRetry,
  onClose,
}: PaymentResultProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(transactionReference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isFullySettled = remainingDuePaise === 0;

  if (!success) {
    return (
      <div className="py-8 px-6 flex flex-col items-center text-center space-y-6 animate-in fade-in duration-300">
        <div className="w-16 h-16 rounded-full bg-destructive/15 text-destructive flex items-center justify-center">
          <XCircle className="w-10 h-10" />
        </div>

        <div className="space-y-2 max-w-md">
          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-destructive/10 text-destructive border border-destructive/20">
            DEMO PAYMENT DECLINED
          </span>
          <h3 className="text-xl font-bold tracking-tight">
            Transaction Simulation Failed
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {errorMessage ||
              "The simulated payment was rejected by the demo gateway. Your invoice balance remains untouched."}
          </p>
        </div>

        {/* Diagnostic Card */}
        <div className="w-full bg-muted/40 border border-border rounded-lg p-4 text-xs space-y-2 text-left">
          <div className="flex justify-between items-center text-muted-foreground">
            <span>Invoice:</span>
            <span className="font-semibold text-foreground">{invoiceNumber}</span>
          </div>
          <div className="flex justify-between items-center text-muted-foreground">
            <span>Attempted Method:</span>
            <span className="font-semibold text-foreground uppercase">
              {paymentMethod.replace("_", " ")}
            </span>
          </div>
          <div className="flex justify-between items-center text-muted-foreground">
            <span>Demo Reference:</span>
            <span className="font-mono text-[11px] text-foreground">{transactionReference}</span>
          </div>
          <div className="flex justify-between items-center text-muted-foreground pt-1 border-t">
            <span>Invoice Status:</span>
            <span className="text-amber-600 dark:text-amber-400 font-semibold">
              UNPAID / UNCHANGED
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm pt-2">
          <Button
            onClick={onRetry}
            className="flex-1 flex items-center justify-center gap-1.5"
            variant="default"
          >
            <RotateCcw className="w-4 h-4" />
            Try Again / Change Method
          </Button>
          <Button onClick={onClose} variant="outline" className="flex-1">
            Close Checkout
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-6 flex flex-col items-center text-center space-y-6 animate-in fade-in duration-300">
      <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
        <CheckCircle2 className="w-10 h-10" />
      </div>

      <div className="space-y-2 max-w-md">
        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
          <ShieldCheck className="w-3.5 h-3.5" />
          DEMO TRANSACTION SETTLED
        </div>
        <h3 className="text-xl font-bold tracking-tight">
          Payment Recorded Successfully!
        </h3>
        <p className="text-2xl font-black text-foreground">
          {formatINR(Math.round(amountRupees * 100))}
        </p>
        <p className="text-xs text-muted-foreground">
          Recorded in Brightloop database for {invoiceNumber} • {customerName}
        </p>
      </div>

      {/* Settlement Details */}
      <div className="w-full bg-muted/40 border border-border rounded-lg p-4 text-xs space-y-2.5 text-left">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Transaction Reference:</span>
          <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold bg-background border px-2 py-0.5 rounded">
            <span>{transactionReference}</span>
            <button
              onClick={handleCopy}
              className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
              title="Copy Reference"
            >
              {copied ? (
                <Check className="w-3 h-3 text-emerald-600" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center text-muted-foreground">
          <span>Payment Method:</span>
          <span className="font-semibold text-foreground uppercase">
            {paymentMethod.replace("_", " ")} (Simulated)
          </span>
        </div>

        <div className="flex justify-between items-center text-muted-foreground">
          <span>Amount Settled:</span>
          <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
            {formatINR(Math.round(amountRupees * 100))}
          </span>
        </div>

        <div className="flex justify-between items-center pt-2 border-t text-muted-foreground">
          <span>Remaining Invoice Balance:</span>
          <span className="font-bold text-foreground font-mono">
            {formatINR(remainingDuePaise)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span>New Invoice Status:</span>
          <span
            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
              isFullySettled
                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                : "bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/20"
            }`}
          >
            {isFullySettled ? "PAID IN FULL" : "PARTIALLY PAID (OPEN)"}
          </span>
        </div>
      </div>

      {/* Action Button */}
      <Button
        onClick={onClose}
        className="w-full max-w-sm flex items-center justify-center gap-2"
        size="lg"
      >
        <Receipt className="w-4 h-4" />
        Return to Updated Invoice
        <ArrowRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );
}

