/**
 * Brightloop Telemetry & Billing Type Definitions
 * Shared types for Admin Dashboard, Reports, and Customer Portal.
 */

// ==========================================
// ENUMS & UNIONS
// ==========================================

export type SubscriptionStatus =
  | "draft"
  | "quotation"
  | "confirmed"
  | "active"
  | "closed"
  | "cancelled";

export type InvoiceStatus =
  | "draft"
  | "quotation"
  | "confirmed"
  | "active"
  | "paid"
  | "overdue"
  | "closed"
  | "cancelled";

export type PaymentMethod =
  | "direct_debit"
  | "credit_card"
  | "wire_transfer"
  | "upi";

export type PaymentStatus = "succeeded" | "pending" | "failed";

export type BillingCycle = "monthly" | "quarterly" | "annual";

export type ReportTab = "revenue" | "subscriptions" | "invoices" | "payments";

// ==========================================
// CORE ENTITY MODELS
// ==========================================

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company: string;
  address?: string;
  taxId?: string;
  createdAt: string;
}

export interface Plan {
  id: string;
  name: string;
  code: string;
  billingCycle: BillingCycle;
  amount: number;
  currency: string;
  description?: string;
  active: boolean;
}

export interface SubscriptionLine {
  id: string;
  subscriptionId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Subscription {
  id: string;
  subscriptionNumber: string;
  customerId: string;
  customer?: Customer;
  planId: string;
  plan?: Plan;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
  renewalDate: string;
  totalAmount: number;
  currency: string;
  lines?: SubscriptionLine[];
  createdAt: string;
}

export interface InvoiceLine {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  subscriptionId?: string;
  customerId: string;
  customer?: Customer;
  issueDate: string;
  dueDate: string;
  daysOverdue: number;
  totalAmount: number;
  balance: number;
  currency: string;
  status: InvoiceStatus;
  lines?: InvoiceLine[];
  createdAt: string;
}

export interface Payment {
  id: string;
  paymentNo: string;
  invoiceId: string;
  invoiceNo?: string;
  customerId: string;
  customer?: Customer;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  reference: string;
  paymentDate: string;
  createdAt: string;
}

// ==========================================
// QUERY FILTERS & TELEMETRY PARAMS
// ==========================================

export interface TelemetryFilters {
  datePreset?: string;
  from?: string; // YYYY-MM-DD
  to?: string;   // YYYY-MM-DD
  customerId?: string;
  planId?: string;
  status?: string;
  paymentMethod?: string;
  viewMode?: "summary" | "detailed";
  search?: string;
}

export interface SortParams {
  column: string;
  direction: "asc" | "desc" | null;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ==========================================
// AGGREGATE TELEMETRY MODELS
// ==========================================

export interface DashboardKpis {
  totalRevenue: number;         // e.g. 48,92,500
  activeSubscriptions: number;  // e.g. 1,284
  outstandingPayments: number;  // e.g. 6,41,200
  overdueInvoices: number;      // e.g. 37
  collectionRate: number;       // percentage, e.g. 88.4
  mrr: number;                  // Monthly recurring revenue
  arr: number;                  // Annual run-rate
}

export interface RevenueOverTimePoint {
  period: string;               // e.g. "Dec 10", "Dec 19", "Latest"
  date: string;
  revenue: number;
  target?: number;
  highlighted?: boolean;        // true for latest period (renders orange #F57B4A)
}

export interface SubscriptionsByStatusPoint {
  status: SubscriptionStatus;
  label: string;
  count: number;
  percentage: number;
}

export interface PaymentsByMethodPoint {
  method: PaymentMethod;
  methodName: string;
  amount: number;
  count: number;
  percentage: number;
  colorHex: string;             // Charcoal, Grey-Green, or Orange
}

export interface ReportRow {
  id: string;
  code: string;
  name: string;
  secondary: string;
  date: string;
  metric1: number;
  metric2: number;
  status: string;
  badgeStatus: SubscriptionStatus | InvoiceStatus;
}

export interface ReportSummaryStat {
  label: string;
  value: string;
  caption: string;
  variant: "charcoal" | "grey" | "orange";
}

export interface ReportSummaryStats {
  stat1: ReportSummaryStat;
  stat2: ReportSummaryStat;
  stat3: ReportSummaryStat;
}

