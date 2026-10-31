import {
  DashboardKpis,
  Invoice,
  PaginatedResult,
  PaymentsByMethodPoint,
  ReportRow,
  ReportTab,
  RevenueOverTimePoint,
  SortParams,
  SubscriptionsByStatusPoint,
  TelemetryFilters,
} from "@/types";
import { getMockStore } from "./mock-generator";
import { supabase } from "@/lib/supabase";

/**
 * Checks whether mock telemetry should be returned
 */
export function shouldUseMockData(): boolean {
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_USE_MOCK_DATA !== "false";
  }
  return (
    process.env.USE_MOCK_DATA === "true" ||
    process.env.NEXT_PUBLIC_USE_MOCK_DATA !== "false" ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")
  );
}

// ==========================================
// 1. DASHBOARD KPIS
// ==========================================

export async function getDashboardKpis(
  filters: TelemetryFilters = {}
): Promise<DashboardKpis> {
  if (shouldUseMockData()) {
    const store = getMockStore();
    let relevantSubs = store.subscriptions;
    let relevantInvoices = store.invoices;

    // Apply customer filter if present
    if (filters.customerId && filters.customerId !== "all") {
      relevantSubs = relevantSubs.filter((s) => s.customerId === filters.customerId);
      relevantInvoices = relevantInvoices.filter((i) => i.customerId === filters.customerId);
    }

    // Apply plan filter if present
    if (filters.planId && filters.planId !== "all") {
      relevantSubs = relevantSubs.filter((s) => s.planId === filters.planId);
    }

    // Mock calculations
    const activeSubscriptions = relevantSubs.filter((s) => s.status === "active").length;
    const overdueInvoicesList = relevantInvoices.filter((i) => i.status === "overdue");
    const overdueCount = overdueInvoicesList.length;

    const outstandingPayments = overdueInvoicesList.reduce(
      (sum, inv) => sum + inv.balance,
      0
    );

    const paidInvoicesList = relevantInvoices.filter((i) => i.status === "paid");
    const totalRevenue = paidInvoicesList.reduce((sum, inv) => sum + inv.totalAmount, 0);

    const totalBilled = totalRevenue + outstandingPayments;
    const collectionRate = totalBilled > 0 ? (totalRevenue / totalBilled) * 100 : 92.5;

    return {
      totalRevenue: totalRevenue || 4892500,
      activeSubscriptions: activeSubscriptions || 1284,
      outstandingPayments: outstandingPayments || 641200,
      overdueInvoices: overdueCount || 37,
      collectionRate: Number(collectionRate.toFixed(1)),
      mrr: 4077000,
      arr: 48924000,
    };
  }

  // Supabase RPC Implementation (delegates aggregation to PostgreSQL engine)
  const { data, error } = await supabase.rpc("get_dashboard_kpis", {
    p_start_date: filters.from || null,
    p_end_date: filters.to || null,
    p_customer_id: filters.customerId !== "all" ? filters.customerId : null,
    p_plan_id: filters.planId !== "all" ? filters.planId : null,
  });

  if (error || !data) {
    console.error("Supabase get_dashboard_kpis error:", error);
    throw new Error(error?.message || "Failed to fetch dashboard KPIs from Supabase");
  }

  return {
    totalRevenue: data.total_revenue,
    activeSubscriptions: data.active_subscriptions,
    outstandingPayments: data.outstanding_payments,
    overdueInvoices: data.overdue_invoices,
    collectionRate: data.collection_rate,
    mrr: data.mrr,
    arr: data.arr,
  };
}

// ==========================================
// 2. REVENUE OVER TIME
// ==========================================

export async function getRevenueOverTime(
  filters: TelemetryFilters = {}
): Promise<RevenueOverTimePoint[]> {
  if (shouldUseMockData()) {
    // Aligns with the telemetry chart bars in the reference mockup
    return [
      { period: "Dec 10", date: "2026-06-10", revenue: 3820000, highlighted: false },
      { period: "Dec 19", date: "2026-07-19", revenue: 4210000, highlighted: false },
      { period: "Dec 25", date: "2026-08-25", revenue: 4450000, highlighted: false },
      { period: "Dec 29", date: "2026-09-29", revenue: 4620000, highlighted: false },
      { period: "Latest", date: "2026-10-31", revenue: 4892500, highlighted: true },
    ];
  }

  const { data, error } = await supabase.rpc("get_revenue_over_time", {
    p_start_date: filters.from || null,
    p_end_date: filters.to || null,
    p_customer_id: filters.customerId !== "all" ? filters.customerId : null,
  });

  if (error || !data) {
    throw new Error(error?.message || "Failed to fetch revenue over time");
  }

  return data.map((item: any) => ({
    period: item.period_label,
    date: item.period_date,
    revenue: item.revenue,
    highlighted: Boolean(item.is_latest),
  }));
}

// ==========================================
// 3. SUBSCRIPTIONS BY STATUS
// ==========================================

export async function getSubscriptionsByStatus(
  filters: TelemetryFilters = {}
): Promise<SubscriptionsByStatusPoint[]> {
  if (shouldUseMockData()) {
    const store = getMockStore();
    const subs = store.subscriptions;
    const total = subs.length;

    const draftCount = subs.filter((s) => s.status === "draft").length;
    const quotationCount = subs.filter((s) => s.status === "quotation").length;
    const confirmedCount = subs.filter((s) => s.status === "confirmed").length;
    const activeCount = subs.filter((s) => s.status === "active").length;
    const closedCount = subs.filter((s) => s.status === "closed").length;
    const statusTotal = draftCount + quotationCount + confirmedCount + activeCount + closedCount;

    return [
      {
        status: "draft",
        label: "Draft",
        count: draftCount,
        percentage: Number(((draftCount / statusTotal) * 100).toFixed(1)),
      },
      {
        status: "quotation",
        label: "Quotation",
        count: quotationCount,
        percentage: Number(((quotationCount / statusTotal) * 100).toFixed(1)),
      },
      {
        status: "confirmed",
        label: "Confirmed",
        count: confirmedCount,
        percentage: Number(((confirmedCount / statusTotal) * 100).toFixed(1)),
      },
      {
        status: "active",
        label: "Active",
        count: activeCount,
        percentage: Number(((activeCount / statusTotal) * 100).toFixed(1)),
      },
      {
        status: "closed",
        label: "Closed",
        count: closedCount,
        percentage: Number(((closedCount / statusTotal) * 100).toFixed(1)),
      },
    ];
  }

  const { data, error } = await supabase.rpc("get_subscriptions_by_status", {
    p_customer_id: filters.customerId !== "all" ? filters.customerId : null,
  });

  if (error || !data) {
    throw new Error(error?.message || "Failed to fetch subscriptions by status");
  }

  return data;
}

// ==========================================
// 4. PAYMENTS BY METHOD
// ==========================================

export async function getPaymentsByMethod(
  filters: TelemetryFilters = {}
): Promise<PaymentsByMethodPoint[]> {
  if (shouldUseMockData()) {
    // Exact tri-color distribution matching mockup donut:
    // Charcoal (#2B302B), Grey-Green (#8A968A), Accent Orange (#F57B4A), Light Sage (#D3E3D3)
    return [
      {
        method: "direct_debit",
        methodName: "Direct Debit",
        amount: 2544100,
        count: 182,
        percentage: 52.0,
        colorHex: "#2B302B",
      },
      {
        method: "credit_card",
        methodName: "Credit Card",
        amount: 1369900,
        count: 98,
        percentage: 28.0,
        colorHex: "#8A968A",
      },
      {
        method: "wire_transfer",
        methodName: "Wire Transfer",
        amount: 587100,
        count: 42,
        percentage: 12.0,
        colorHex: "#F57B4A",
      },
      {
        method: "upi",
        methodName: "UPI / Instant",
        amount: 391400,
        count: 28,
        percentage: 8.0,
        colorHex: "#D3E3D3",
      },
    ];
  }

  const { data, error } = await supabase.rpc("get_payments_by_method", {
    p_start_date: filters.from || null,
    p_end_date: filters.to || null,
  });

  if (error || !data) {
    throw new Error(error?.message || "Failed to fetch payments by method");
  }

  return data;
}

// ==========================================
// 5. OVERDUE INVOICES
// ==========================================

export async function getOverdueInvoices(
  filters: TelemetryFilters = {},
  page: number = 1,
  sort: SortParams = { column: "daysOverdue", direction: "desc" },
  pageSize: number = 5
): Promise<PaginatedResult<Invoice>> {
  if (shouldUseMockData()) {
    const store = getMockStore();
    let overdues = store.invoices.filter((i) => i.status === "overdue");

    if (filters.customerId && filters.customerId !== "all") {
      overdues = overdues.filter((i) => i.customerId === filters.customerId);
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      overdues = overdues.filter(
        (i) =>
          i.invoiceNo.toLowerCase().includes(q) ||
          i.customer?.name.toLowerCase().includes(q) ||
          i.customer?.company.toLowerCase().includes(q)
      );
    }

    // Sort logic
    if (sort.direction) {
      overdues.sort((a: any, b: any) => {
        let aVal = a[sort.column];
        let bVal = b[sort.column];
        if (sort.column === "customer") {
          aVal = a.customer?.company || "";
          bVal = b.customer?.company || "";
        }
        if (typeof aVal === "number" && typeof bVal === "number") {
          const diff = sort.direction === "asc" ? aVal - bVal : bVal - aVal;
          if (diff !== 0) return diff;
          return a.invoiceNo.localeCompare(b.invoiceNo);
        }
        return sort.direction === "asc"
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal));
      });
    }

    const total = overdues.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const data = overdues.slice(start, end);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  }

  // Supabase View with server-side range pagination and sorting
  let query = supabase
    .from("view_overdue_invoices")
    .select("*", { count: "exact" });

  if (filters.customerId && filters.customerId !== "all") {
    query = query.eq("customer_id", filters.customerId);
  }

  if (sort.column && sort.direction) {
    query = query.order(sort.column, { ascending: sort.direction === "asc" });
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, count, error } = await query.range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  return {
    data: data || [],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize) || 1,
  };
}

// ==========================================
// 6. REPORT ROWS
// ==========================================

export async function getReportRows(
  tab: ReportTab = "revenue",
  filters: TelemetryFilters = {},
  page: number = 1,
  sort: SortParams = { column: "date", direction: "desc" },
  pageSize: number = 10
): Promise<PaginatedResult<ReportRow>> {
  if (shouldUseMockData()) {
    const store = getMockStore();
    let rows: ReportRow[] = [];

    if (tab === "revenue" || tab === "invoices") {
      rows = store.invoices.map((inv) => ({
        id: inv.id,
        code: inv.invoiceNo,
        name: inv.customer?.company || "Unknown",
        secondary: `Due: ${inv.dueDate}`,
        date: inv.issueDate,
        metric1: inv.totalAmount,
        metric2: inv.balance,
        status: inv.status.toUpperCase(),
        badgeStatus: inv.status,
      }));
    } else if (tab === "subscriptions") {
      rows = store.subscriptions.map((sub) => ({
        id: sub.id,
        code: sub.subscriptionNumber,
        name: sub.customer?.company || "Unknown",
        secondary: sub.plan?.name || "Standard",
        date: sub.startDate,
        metric1: sub.totalAmount,
        metric2: sub.plan?.amount || 0,
        status: sub.status.toUpperCase(),
        badgeStatus: sub.status,
      }));
    } else if (tab === "payments") {
      rows = store.payments.map((p) => ({
        id: p.id,
        code: p.paymentNo,
        name: p.customer?.company || "Unknown",
        secondary: p.method.replace("_", " ").toUpperCase(),
        date: p.paymentDate.split("T")[0],
        metric1: p.amount,
        metric2: 0,
        status: p.status === "succeeded" ? "PAID" : p.status.toUpperCase(),
        badgeStatus: p.status === "succeeded" ? "paid" : "overdue",
      }));
    }

    if (sort.direction) {
      rows.sort((a: any, b: any) => {
        const aVal = a[sort.column];
        const bVal = b[sort.column];
        if (typeof aVal === "number" && typeof bVal === "number") {
          const diff = sort.direction === "asc" ? aVal - bVal : bVal - aVal;
          if (diff !== 0) return diff;
          return a.invoiceNo.localeCompare(b.invoiceNo);
        }
        return sort.direction === "asc"
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal));
      });
    }

    const total = rows.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const data = rows.slice(start, end);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  }

  // Supabase View implementation
  const viewName = `view_report_${tab}`;
  let query = supabase.from(viewName).select("*", { count: "exact" });

  if (sort.column && sort.direction) {
    query = query.order(sort.column, { ascending: sort.direction === "asc" });
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, count, error } = await query.range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  return {
    data: data || [],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize) || 1,
  };
}
