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
  | "cancelled"
  | "paused"
  | "open"
  | "void"
  | "uncollectible";

const statusVariants = cva(
  "inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full transition-colors border select-none tabular-nums whitespace-nowrap",
  {
    variants: {
      status: {
        draft: "bg-[#E5E9E4] text-[#1F2622] border-transparent",
        quotation: "bg-[#DDE5DB] text-[#1F2622] border-transparent",
        confirmed: "bg-[#8C9B8E] text-white border-transparent",
        active: "bg-[#1F2622] text-white border-transparent",
        paid: "bg-[#DDE5DB] text-[#1F2622] border-transparent",
        overdue: "bg-[#FDECE5] text-[#F27B4B] border border-[#F27B4B]/40 font-bold",
        closed: "bg-[#E5E9E4] text-[#8C9B8E] border-transparent",
        cancelled: "bg-[#FDECE5] text-[#F27B4B] border border-[#F27B4B]/40",
        paused: "bg-white text-[#F27B4B] border border-[#F27B4B] font-bold",
        open: "bg-[#DDE5DB] text-[#1F2622] border-transparent",
        void: "bg-[#E5E9E4] text-[#8C9B8E] border-transparent",
        uncollectible: "bg-[#FDECE5] text-[#F27B4B] border border-[#F27B4B]/40",
      },
      size: {
        sm: "text-[9px] px-2 py-0.5",
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
 * Pill shape with exact Brightloop palette colors and active pulse dot.
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
          className="w-1.5 h-1.5 rounded-full bg-[#8C9B8E] inline-block animate-pulse shrink-0"
          aria-hidden="true"
        />
      )}
      {displayLabel}
    </span>
  );
}
