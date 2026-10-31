import * as React from "react";
import { Payment, PaymentMethod } from "@/types";
import { formatMoney } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface MethodTotal {
  method: PaymentMethod;
  label: string;
  amount: number;
  color: string;
  bgClass: string;
}

const METHOD_CONFIG: Record<
  PaymentMethod,
  { label: string; color: string; bgClass: string }
> = {
  direct_debit: {
    label: "DIRECT DEBIT",
    color: "#2B302B",
    bgClass: "bg-[#2B302B]",
  },
  credit_card: {
    label: "CREDIT CARD",
    color: "#8A968A",
    bgClass: "bg-[#8A968A]",
  },
  wire_transfer: {
    label: "WIRE TRANSFER",
    color: "#B9CBB9",
    bgClass: "bg-[#B9CBB9]",
  },
  upi: { label: "UPI", color: "#F57B4A", bgClass: "bg-[#F57B4A]" },
};

interface PaymentMethodSummaryProps {
  payments: Payment[];
  className?: string;
}

/**
 * PaymentMethodSummary
 * Three-segment horizontal bar showing total amounts by payment method.
 * Charcoal = direct debit, grey-green = credit card, sage = wire transfer, orange = UPI.
 */
export function PaymentMethodSummary({
  payments,
  className,
}: PaymentMethodSummaryProps) {
  const totals: Record<PaymentMethod, number> = {
    direct_debit: 0,
    credit_card: 0,
    wire_transfer: 0,
    upi: 0,
  };

  for (const p of payments) {
    const m = (p.method || p.paymentMethod) as PaymentMethod;
    if (m && totals[m] !== undefined) {
      totals[m] = (totals[m] || 0) + (p.amount ?? 0);
    }
  }

  const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0);

  const segments: MethodTotal[] = (
    Object.entries(totals) as [PaymentMethod, number][]
  )
    .filter(([, amount]) => amount > 0)
    .map(([method, amount]) => ({
      method,
      label: METHOD_CONFIG[method].label,
      amount,
      color: METHOD_CONFIG[method].color,
      bgClass: METHOD_CONFIG[method].bgClass,
    }));

  if (grandTotal === 0) return null;

  return (
    <div
      className={cn(
        "bg-white border-[1.5px] border-[#B9CBB9] rounded-[3px] p-4",
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#2B302B] font-mono">
          PAYMENT METHOD BREAKDOWN
        </span>
        <span className="text-xs font-semibold text-[#2B302B] tabular-nums font-mono">
          {formatMoney(grandTotal)} TOTAL
        </span>
      </div>

      {/* Segmented bar */}
      <div className="w-full h-3 rounded-[2px] overflow-hidden flex mb-3 border border-[#B9CBB9]">
        {segments.map((seg) => {
          const pct = (seg.amount / grandTotal) * 100;
          return (
            <div
              key={seg.method}
              className={cn("h-full transition-all", seg.bgClass)}
              style={{ width: `${pct}%` }}
              title={`${seg.label}: ${formatMoney(seg.amount)} (${pct.toFixed(1)}%)`}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4">
        {segments.map((seg) => {
          const pct = ((seg.amount / grandTotal) * 100).toFixed(1);
          return (
            <div key={seg.method} className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-[1px] shrink-0"
                style={{ backgroundColor: seg.color }}
              />
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A968A] font-mono">
                {seg.label}
              </span>
              <span className="text-[10px] font-semibold text-[#2B302B] tabular-nums font-mono">
                {formatMoney(seg.amount)}
              </span>
              <span className="text-[10px] text-[#8A968A] font-mono">
                ({pct}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
