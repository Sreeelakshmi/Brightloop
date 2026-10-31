import * as React from "react";
import { Payment } from "@/types";
import { formatMoney, formatDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

interface PaymentHistoryTimelineProps {
  payments: Payment[];
  className?: string;
}

const METHOD_LABEL: Record<string, string> = {
  direct_debit: "Direct Debit",
  credit_card: "Credit Card",
  wire_transfer: "Wire Transfer",
  upi: "UPI",
};

/**
 * PaymentHistoryTimeline
 * Vertical timeline of payments linked to a specific invoice.
 */
export function PaymentHistoryTimeline({
  payments,
  className,
}: PaymentHistoryTimelineProps) {
  if (!payments || payments.length === 0) {
    return (
      <div className={cn("py-6 text-center text-[#8C9B8E] text-xs font-mono", className)}>
        NO PAYMENT RECORDS
      </div>
    );
  }

  return (
    <div className={cn("space-y-0", className)}>
      {payments.map((payment, idx) => (
        <div key={payment.id} className="flex gap-3">
          {/* Timeline track */}
          <div className="flex flex-col items-center">
            <div className="w-6 h-6 rounded-full bg-[#DDE5DB] border border-[#D5DDD2] flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#1F2622]" />
            </div>
            {idx < payments.length - 1 && (
              <div className="w-px flex-1 bg-[#D5DDD2] my-1 min-h-[20px]" />
            )}
          </div>

          {/* Content */}
          <div className="pb-4 min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-xs font-bold text-[#1F2622] tabular-nums">
                {formatMoney(payment.amount, { currency: payment.currency === "INR" ? "₹" : payment.currency })}
              </span>
              <span className="text-[10px] font-mono text-[#8C9B8E]">
                {formatDate(payment.paymentDate)}
              </span>
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider font-bold font-mono text-[#8C9B8E]">
                {METHOD_LABEL[payment.method] ?? payment.method}
              </span>
              {payment.reference && (
                <span className="text-[10px] font-mono text-[#8C9B8E]">
                  REF: {payment.reference}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

