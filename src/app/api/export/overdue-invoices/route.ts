import { NextRequest, NextResponse } from "next/server";
import { getOverdueInvoices } from "@/lib/data/dashboard";
import { formatDate } from "@/lib/formatters";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;

  const filters = {
    customerId: sp.get("customer") !== "all" ? (sp.get("customer") ?? undefined) : undefined,
    planId: sp.get("plan") !== "all" ? (sp.get("plan") ?? undefined) : undefined,
  };

  // Fetch all overdue invoices (large page)
  const result = await getOverdueInvoices(filters, 1, { column: "dueDate", direction: "asc" }, 9999);

  const rows = result.data.map((inv) => {
    const due = new Date(inv.dueDate);
    const days = Math.max(0, Math.floor((Date.now() - due.getTime()) / 86400000));
    return [
      inv.invoiceNo,
      inv.customer?.company ?? "",
      formatDate(inv.dueDate),
      `${days}d`,
      inv.balance,
      inv.status.toUpperCase(),
    ].join(",");
  });

  const csv = ["Invoice No.,Customer,Due Date,Days Overdue,Balance,Status", ...rows].join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="overdue-invoices-${Date.now()}.csv"`,
    },
  });
}
