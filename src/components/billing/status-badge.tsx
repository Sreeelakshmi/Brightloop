import React from "react";
import { Badge } from "@/components/ui/badge";
import { ExtendedInvoiceStatus, PaymentStatus } from "@/types";

export function InvoiceStatusBadge({ status }: { status: ExtendedInvoiceStatus }) {
  switch (status.toLowerCase()) {
    case "paid":
      return (
        <Badge variant="success" className="font-medium capitalize">
          Paid
        </Badge>
      );
    case "overdue":
      return (
        <Badge variant="destructive" className="font-medium capitalize">
          Overdue
        </Badge>
      );
    case "confirmed":
    case "open":
      return (
        <Badge variant="info" className="font-medium capitalize">
          Confirmed
        </Badge>
      );
    case "draft":
      return (
        <Badge variant="secondary" className="font-medium capitalize">
          Draft
        </Badge>
      );
    case "cancelled":
    case "void":
      return (
        <Badge variant="outline" className="font-medium text-muted-foreground capitalize">
          Cancelled
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" className="capitalize">
          {status}
        </Badge>
      );
  }
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  switch (status) {
    case "succeeded":
      return (
        <Badge variant="success" className="font-medium">
          Succeeded
        </Badge>
      );
    case "pending":
      return (
        <Badge variant="warning" className="font-medium">
          Pending
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="destructive" className="font-medium">
          Failed
        </Badge>
      );
    case "refunded":
      return (
        <Badge variant="outline" className="font-medium">
          Refunded
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

