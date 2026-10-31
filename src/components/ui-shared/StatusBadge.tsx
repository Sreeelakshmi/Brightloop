import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export type SubscriptionOrInvoiceStatus =
  | "draft"
  | "quotation"
  | "confirmed"
  | "active"
  | "paid"
  | "overdue"
  | "closed"
  | "cancelled";

const statusVariants = cva(
  "inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-[2px] transition-colors border select-none tabular-nums whitespace-nowrap",
  {
    variants: {
      status: {
        draft: "border-[#8A968A] text-[#8A968A] bg-transparent",
        quotation: "border-[#2B302B] text-[#2B302B] bg-transparent",
        confirmed: "border-[#2B302B] bg-[#2B302B] text-white",
        active: "border-[#2B302B] bg-[#2B302B] text-white",
        paid: "border-[#D3E3D3] bg-[#D3E3D3] text-[#2B302B]",
        overdue: "border-[#F57B4A] bg-[#F57B4A] text-white font-black",
        closed: "border-[#8A968A] bg-[#8A968A] text-white",
        cancelled: "border-[#F57B4A] text-[#F57B4A] bg-transparent",
      },
      size: {
        sm: "text-[9px] px-1.5 py-0.2",
        default: "text-[10px] px-2.5 py-0.5",
        lg: "text-[11px] px-3 py-1",
      },
    },
    defaultVariants: {
      status: "draft",
      size: "default",
    },
  }
);

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    Omit<VariantProps<typeof statusVariants>, "status"> {
  status: SubscriptionOrInvoiceStatus | string;
  label?: string;
}

/**
 * StatusBadge Component
 * Implements the 8 system status badge design specs with exact colors and active pulse dot.
 */
export function StatusBadge({
  status,
  label,
  size,
  className,
  ...props
}: StatusBadgeProps) {
  const normalizedStatus = (status?.toLowerCase() || "draft") as SubscriptionOrInvoiceStatus;
  const displayLabel = label || normalizedStatus.toUpperCase();

  return (
    <span
      className={cn(statusVariants({ status: normalizedStatus, size }), className)}
      {...props}
    >
      {normalizedStatus === "active" && (
        <span
          className="w-1.5 h-1.5 rounded-full bg-[#D3E3D3] inline-block animate-pulse shrink-0"
          aria-hidden="true"
        />
      )}
      {displayLabel}
    </span>
  );
}
