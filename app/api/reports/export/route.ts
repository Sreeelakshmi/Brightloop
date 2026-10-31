import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, UserRole } from "@/lib/auth";
import { getReportRows } from "@/lib/data/dashboard";
import { ReportTab, SortParams, TelemetryFilters } from "@/types";

/**
 * Escapes values safely against CSV Injection (Formula Injection) and RFC 4180 compliance.
 */
function escapeCsvValue(val: unknown): string {
  if (val === null || val === undefined) return '""';
  let str = String(val).trim();

  // Prevent Spreadsheet Formula Injection: prefix with single quote if starting with =, +, -, @, \t, \r
  if (/^[=\+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // Double up any quotes and wrap in quotes if contains delimiter, quotes, or newlines
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return `"${str}"`;
}

export async function GET(request: NextRequest) {
  // 1. Enforce Admin/Staff authorization only
  const cookieStore = cookies();
  const role = cookieStore.get(AUTH_COOKIE_NAME)?.value as UserRole | undefined;

  if (role !== "admin" && role !== "staff") {
    return new NextResponse(
      JSON.stringify({
        error: "Forbidden: Access to report exports requires Admin or Staff privileges.",
      }),
      {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // 2. Parse query parameters
  const sp = request.nextUrl.searchParams;
  const tab = (sp.get("tab") as ReportTab) || "subscriptions";

  const filters: TelemetryFilters = {
    customerId: sp.get("customer") !== "all" ? (sp.get("customer") ?? undefined) : undefined,
    planId: sp.get("plan") !== "all" ? (sp.get("plan") ?? undefined) : undefined,
    status: sp.get("status") !== "all" ? (sp.get("status") ?? undefined) : undefined,
    paymentMethod: sp.get("method") !== "all" ? (sp.get("method") ?? undefined) : undefined,
    search: sp.get("search") ?? undefined,
  };

  const sort: SortParams = {
    column: sp.get("sort") ?? "date",
    direction: (sp.get("dir") as "asc" | "desc") ?? "desc",
  };

  // 3. Fetch all matching records (large page size)
  const result = await getReportRows(tab, filters, 1, sort, 50000);

  // 4. Build CSV headers and rows
  let headers: string[] = [];
  let rowExtractor: (row: any) => (string | number)[];

  if (tab === "subscriptions") {
    headers = [
      "Subscription No.",
      "Customer",
      "Plan",
      "Start Date",
      "Total Amount (INR)",
      "Plan Rate (INR)",
      "Status",
    ];
    rowExtractor = (r) => [r.code, r.name, r.secondary, r.date, r.metric1, r.metric2, r.status];
  } else if (tab === "payments") {
    headers = [
      "Payment No.",
      "Customer",
      "Method",
      "Payment Date",
      "Amount (INR)",
      "Status",
    ];
    rowExtractor = (r) => [r.code, r.name, r.secondary, r.date, r.metric1, r.status];
  } else if (tab === "invoices") {
    headers = [
      "Invoice No.",
      "Customer",
      "Issue Date",
      "Due Date",
      "Total Amount (INR)",
      "Balance Due (INR)",
      "Status",
    ];
    rowExtractor = (r) => [r.code, r.name, r.date, r.secondary, r.metric1, r.metric2, r.status];
  } else {
    // revenue
    headers = [
      "Invoice No.",
      "Customer",
      "Issue Date",
      "Due Date",
      "Total Billed (INR)",
      "Balance Due (INR)",
      "Status",
    ];
    rowExtractor = (r) => [r.code, r.name, r.date, r.secondary, r.metric1, r.metric2, r.status];
  }

  // 5. Stream the CSV response via ReadableStream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // UTF-8 BOM for Excel compatibility + Header Line
      const headerLine = "\uFEFF" + headers.map(escapeCsvValue).join(",") + "\r\n";
      controller.enqueue(encoder.encode(headerLine));

      // Stream data in batches of 50 rows
      const chunkSize = 50;
      for (let i = 0; i < result.data.length; i += chunkSize) {
        const chunk = result.data.slice(i, i + chunkSize);
        const lines = chunk
          .map((row) => rowExtractor(row).map(escapeCsvValue).join(","))
          .join("\r\n") + "\r\n";
        controller.enqueue(encoder.encode(lines));
      }

      controller.close();
    },
  });

  const timestamp = new Date().toISOString().split("T")[0];
  const filename = `brightloop-report-${tab}-${timestamp}.csv`;

  return new NextResponse(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
