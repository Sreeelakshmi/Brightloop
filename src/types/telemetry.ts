/**
 * Brightloop Telemetry & Dashboard Type Definitions
 * Shared types for Admin Dashboard, Reports, and Customer Portal.
 */

import type { PaymentStatus, PaymentMethodType } from "./index";

export type BillingCycle = "monthly" | "quarterly" | "annual";

export type ReportTab = "revenue" | "subscriptions" | "invoices" | "payments";

export type PaymentMethod =
  | "direct_debit"
  | "credit_card"
  | "wire_transfer"
  | "upi";

export interface InvoiceLine {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

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
  highlighted?: boolean;        // true for latest period (renders orange #F27B4B)
}

export interface SubscriptionsByStatusPoint {
  status: string;
  label: string;
  count: number;
  percentage: number;
}

export interface PaymentsByMethodPoint {
  method: string;
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
  badgeStatus: string;
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
