import {
  DashboardKpis,
  Invoice,
  PaginatedResult,
  PaymentsByMethodPoint,
  ReportRow,
  ReportSummaryStats,
  ReportTab,
  RevenueOverTimePoint,
  SortParams,
  SubscriptionsByStatusPoint,
  TelemetryFilters,
} from "@/types";
import { getMockStore } from "./mock-generator";
import { supabase } from "@/lib/supabase";
import { formatMoney, formatNumber } from "@/lib/formatters";

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

function matchesCustomer(
  customer: { id?: string; name?: string; company?: string } | undefined,
  customerId?: string
): boolean {
  if (!customerId || customerId === "all" || customerId === "customer" || customerId === "all-customers") {
    return true;
  }
  if (!customer) return false;
  const target = customerId.toLowerCase().trim();
  const idMatch = customer.id?.toLowerCase() === target;
  const companySlug = customer.company?.toLowerCase().replace(/\s+/g, "-");
  const nameSlug = customer.name?.toLowerCase().replace(/\s+/g, "-");
  const companyMatch = customer.company?.toLowerCase().includes(target);
  const nameMatch = customer.name?.toLowerCase().includes(target);
  return idMatch || companySlug === target || nameSlug === target || Boolean(companyMatch) || Boolean(nameMatch);
}

function matchesPlan(
  plan: { id?: string; name?: string; code?: string } | undefined,
  planId?: string
): boolean {
  if (!planId || planId === "all" || planId === "plan" || planId === "all-plans") {
    return true;
  }
  if (!plan) return false;
  const target = planId.toLowerCase().trim();
  const idMatch = plan.id?.toLowerCase() === target;
  const codeMatch = plan.code?.toLowerCase() === target;
  const nameSlug = plan.name?.toLowerCase().replace(/\s+/g, "-");
  const nameMatch = plan.name?.toLowerCase().includes(target);
  return idMatch || codeMatch || nameSlug === target || Boolean(nameMatch);
}

function matchesStatus(status: string | undefined, filterStatus?: string): boolean {
  if (!filterStatus || filterStatus === "all" || filterStatus === "all-statuses" || filterStatus === "status") {
    return true;
  }
  if (!status) return false;
  return status.toLowerCase() === filterStatus.toLowerCase();
}

function matchesPaymentMethod(method: string | undefined, filterMethod?: string): boolean {
  if (!filterMethod || filterMethod === "all" || filterMethod === "all-methods" || filterMethod === "payment-method") {
    return true;
  }
  if (!method) return false;
  const normMethod = method.toLowerCase().replace(/_/g, "-");
  const normFilter = filterMethod.toLowerCase().replace(/_/g, "-");
  return normMethod === normFilter || normMethod.includes(normFilter);
}

function matchesDate(dateStr: string | undefined, from?: string, to?: string): boolean {
  if (!dateStr) return true;
  const date = dateStr.split("T")[0];
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

export async function getReportSummary(
  tab: ReportTab = "revenue",
  filters: TelemetryFilters = {}
): Promise<ReportSummaryStats> {
  if (shouldUseMockData()) {
    const store = getMockStore();

    if (tab === "subscriptions") {
      let subs = store.subscriptions;
      if (filters.customerId) subs = subs.filter((s) => matchesCustomer(s.customer, filters.customerId));
      if (filters.planId) subs = subs.filter((s) => matchesPlan(s.plan, filters.planId));
      if (filters.status) subs = subs.filter((s) => matchesStatus(s.status, filters.status));
      if (filters.from || filters.to) subs = subs.filter((s) => matchesDate(s.startDate, filters.from, filters.to));
      if (filters.search) {
        const q = filters.search.toLowerCase();
        subs = subs.filter((s) => s.subscriptionNumber.toLowerCase().includes(q) || s.customer?.company.toLowerCase().includes(q));
      }

      const totalValue = subs.reduce((sum, s) => sum + s.totalAmount, 0);
      const activeCount = subs.filter((s) => s.status === "active").length;

      return {
        stat1: {
          label: "TOTAL SUBSCRIPTIONS",
          value: formatNumber(subs.length),
          caption: "Matching active query",
          variant: "charcoal",
        },
        stat2: {
          label: "CONTRACTED VALUE",
          value: formatMoney(totalValue),
          caption: "Cumulative portfolio rate",
          variant: "grey",
        },
        stat3: {
          label: "ACTIVE SUBSCRIPTIONS",
          value: formatNumber(activeCount),
          caption: `${((activeCount / (subs.length || 1)) * 100).toFixed(1)}% currently active`,
          variant: "orange",
        },
      };
    }

    if (tab === "payments") {
      let payments = store.payments;
      if (filters.customerId) payments = payments.filter((p) => matchesCustomer(p.customer, filters.customerId));
      if (filters.paymentMethod) payments = payments.filter((p) => matchesPaymentMethod(p.method, filters.paymentMethod));
      if (filters.status) payments = payments.filter((p) => matchesStatus(p.status, filters.status));
      if (filters.from || filters.to) payments = payments.filter((p) => matchesDate(p.paymentDate, filters.from, filters.to));
      if (filters.search) {
        const q = filters.search.toLowerCase();
        payments = payments.filter((p) => p.paymentNo.toLowerCase().includes(q) || p.customer?.company.toLowerCase().includes(q));
      }

      const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
      const avgPayment = payments.length > 0 ? Math.round(totalAmount / payments.length) : 0;

      return {
        stat1: {
          label: "TOTAL PAYMENTS",
          value: formatNumber(payments.length),
          caption: "Processed settlements",
          variant: "charcoal",
        },
        stat2: {
          label: "SETTLED VOLUME",
          value: formatMoney(totalAmount),
          caption: "Gross collected payments",
          variant: "grey",
        },
        stat3: {
          label: "AVG PAYMENT SIZE",
          value: formatMoney(avgPayment),
          caption: "Average settlement ticket",
          variant: "grey",
        },
      };
    }

    // Revenue or Invoices
    let invoices = store.invoices;
    if (filters.customerId) invoices = invoices.filter((i) => matchesCustomer(i.customer, filters.customerId));
    if (filters.status) invoices = invoices.filter((i) => matchesStatus(i.status, filters.status));
    if (filters.from || filters.to) invoices = invoices.filter((i) => matchesDate(i.issueDate, filters.from, filters.to));
    if (filters.search) {
      const q = filters.search.toLowerCase();
      invoices = invoices.filter((i) => i.invoiceNo.toLowerCase().includes(q) || i.customer?.company.toLowerCase().includes(q));
    }

    const totalBilled = invoices.reduce((sum, i) => sum + i.totalAmount, 0);
    const totalBalance = invoices.reduce((sum, i) => sum + i.balance, 0);
    const totalCollected = totalBilled - totalBalance;
    const overdueList = invoices.filter((i) => i.status === "overdue");

    if (tab === "invoices") {
      const paidCount = invoices.filter((i) => i.status === "paid").length;
      return {
        stat1: {
          label: "TOTAL INVOICES",
          value: formatNumber(invoices.length),
          caption: "Generated in period",
          variant: "charcoal",
        },
        stat2: {
          label: "PAID INVOICES",
          value: formatNumber(paidCount),
          caption: `${paidCount} paid in full`,
          variant: "grey",
        },
        stat3: {
          label: "OVERDUE INVOICES",
          value: formatNumber(overdueList.length),
          caption: `${formatMoney(totalBalance)} outstanding`,
          variant: "orange",
        },
      };
    }

    // tab === "revenue"
    return {
      stat1: {
        label: "TOTAL BILLED",
        value: formatMoney(totalBilled),
        caption: "Gross invoiced revenue",
        variant: "charcoal",
      },
      stat2: {
        label: "TOTAL COLLECTED",
        value: formatMoney(totalCollected),
        caption: "Realized cashflow",
        variant: "grey",
      },
      stat3: {
        label: "OUTSTANDING BALANCE",
        value: formatMoney(totalBalance),
        caption: "Pending collection",
        variant: "orange",
      },
    };
  }

  // Fallback defaults for Supabase
  return {
    stat1: { label: "TOTAL", value: "—", caption: "Loading", variant: "charcoal" },
    stat2: { label: "VOLUME", value: "—", caption: "Loading", variant: "grey" },
    stat3: { label: "OUTSTANDING", value: "—", caption: "Loading", variant: "orange" },
  };
}

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
      let invList = store.invoices;
      if (filters.customerId) invList = invList.filter((i) => matchesCustomer(i.customer, filters.customerId));
      if (filters.status) invList = invList.filter((i) => matchesStatus(i.status, filters.status));
      if (filters.from || filters.to) invList = invList.filter((i) => matchesDate(i.issueDate, filters.from, filters.to));
      if (filters.search) {
        const q = filters.search.toLowerCase();
        invList = invList.filter((i) => i.invoiceNo.toLowerCase().includes(q) || i.customer?.company.toLowerCase().includes(q));
      }

      rows = invList.map((inv) => ({
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
      let subList = store.subscriptions;
      if (filters.customerId) subList = subList.filter((s) => matchesCustomer(s.customer, filters.customerId));
      if (filters.planId) subList = subList.filter((s) => matchesPlan(s.plan, filters.planId));
      if (filters.status) subList = subList.filter((s) => matchesStatus(s.status, filters.status));
      if (filters.from || filters.to) subList = subList.filter((s) => matchesDate(s.startDate, filters.from, filters.to));
      if (filters.search) {
        const q = filters.search.toLowerCase();
        subList = subList.filter((s) => s.subscriptionNumber.toLowerCase().includes(q) || s.customer?.company.toLowerCase().includes(q) || s.plan?.name.toLowerCase().includes(q));
      }

      rows = subList.map((sub) => ({
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
      let payList = store.payments;
      if (filters.customerId) payList = payList.filter((p) => matchesCustomer(p.customer, filters.customerId));
      if (filters.paymentMethod) payList = payList.filter((p) => matchesPaymentMethod(p.method, filters.paymentMethod));
      if (filters.status) payList = payList.filter((p) => matchesStatus(p.status, filters.status));
      if (filters.from || filters.to) payList = payList.filter((p) => matchesDate(p.paymentDate, filters.from, filters.to));
      if (filters.search) {
        const q = filters.search.toLowerCase();
        payList = payList.filter((p) => p.paymentNo.toLowerCase().includes(q) || p.customer?.company.toLowerCase().includes(q) || p.reference.toLowerCase().includes(q));
      }

      rows = payList.map((p) => ({
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
          return a.code.localeCompare(b.code);
        }
        return sort.direction === "asc"
          ? String(aVal ?? "").localeCompare(String(bVal ?? ""))
          : String(bVal ?? "").localeCompare(String(aVal ?? ""));
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
