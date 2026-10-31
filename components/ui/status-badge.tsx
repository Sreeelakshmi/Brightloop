import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export type TelemetryStatus =
  | "draft"
  | "quotation"
  | "confirmed"
  | "active"
  | "paid"
  | "overdue"
  | "closed"
  | "cancelled";

const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-[2px] transition-colors border select-none tabular-nums",
  {
    variants: {
      status: {
        // Draft: outlined grey-green
        draft: "border-[#8A968A] text-[#8A968A] bg-transparent",
        // Quotation: outlined charcoal
        quotation: "border-[#2B302B] text-[#2B302B] bg-transparent",
        // Confirmed: charcoal fill, white text
        confirmed: "border-[#2B302B] bg-[#2B302B] text-white",
        // Active: charcoal fill with small sage dot
        active: "border-[#2B302B] bg-[#2B302B] text-white",
        // Paid: light sage fill, charcoal text
        paid: "border-[#D3E3D3] bg-[#D3E3D3] text-[#2B302B]",
        // Overdue: orange fill, white text
        overdue: "border-[#F57B4A] bg-[#F57B4A] text-white",
        // Closed: grey-green fill, white text
        closed: "border-[#8A968A] bg-[#8A968A] text-white",
        // Cancelled: orange outline
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
    VariantProps<typeof statusBadgeVariants> {
  status: TelemetryStatus;
  label?: string;
}

export function StatusBadge({
  status,
  label,
  className,
  size,
  ...props
}: StatusBadgeProps) {
  const displayLabel = label || status.toUpperCase();

  return (
    <span
      className={cn(statusBadgeVariants({ status, size }), className)}
      {...props}
    >
      {status === "active" && (
        <span
          className="w-1.5 h-1.5 rounded-full bg-[#D3E3D3] inline-block animate-pulse shrink-0"
          aria-hidden="true"
        />
      )}
      {displayLabel}
    </span>
  );
}

