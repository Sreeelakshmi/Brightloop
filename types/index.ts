/**
 * Brightloop Telemetry & Billing Type Definitions
 * Shared types for Admin Dashboard, Reports, Customer Portal, and Service Layer.
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
  | "upi"
  | "cash"
  | "cheque";

export type PaymentStatus = "succeeded" | "pending" | "failed";

export type BillingCycle = "daily" | "weekly" | "monthly" | "quarterly" | "annual" | "yearly";

export type PlanBillingPeriod = "daily" | "weekly" | "monthly" | "quarterly" | "yearly";

export type ProductType = "service" | "consumable" | "storable";

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

export interface ProductVariant {
  id: string;
  productId: string;
  attributeName: string; // e.g. "Brand"
  attributeValue: string; // e.g. "Odoo", "Standard"
  extraPrice: number; // e.g. 560
}

export interface Product {
  id: string;
  name: string;
  type: ProductType;
  salesPrice: number;
  costPrice: number;
  notes?: string;
  archived?: boolean;
  variants: ProductVariant[];
  createdAt?: string;
}

export interface Plan {
  id: string;
  name: string;
  code: string;
  billingCycle: BillingCycle;
  billingPeriod?: PlanBillingPeriod;
  amount: number;
  price?: number;
  currency: string;
  description?: string;
  active: boolean;
  minimumQuantity?: number;
  availableFrom?: string;
  availableTo?: string;
  autoClose?: boolean;
  closableEarly?: boolean;
  renewable?: boolean;
  pausable?: boolean;
  closable?: boolean;
}

export interface SubscriptionLine {
  id: string;
  subscriptionId: string;
  productId?: string;
  variantId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
  taxAmount?: number;
  discountAmount?: number;
  amount: number;
}

export interface SubscriptionStatusHistory {
  id: string;
  subscriptionId: string;
  fromStatus: SubscriptionStatus;
  toStatus: SubscriptionStatus;
  changedBy: string;
  changedAt: string;
  reason?: string;
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
  nextBillingDate?: string;
  paymentTerms?: string;
  paused?: boolean;
  totalAmount: number;
  currency: string;
  lines?: SubscriptionLine[];
  history?: SubscriptionStatusHistory[];
  validUntil?: string; // For quotations
  createdAt: string;
}

export interface QuotationTemplateLine {
  id?: string;
  productId: string;
  variantId?: string;
  quantity: number;
  unitPrice: number;
}

export interface QuotationTemplate {
  id: string;
  name: string;
  validityDays: number;
  planId: string;
  lines: QuotationTemplateLine[];
  createdAt?: string;
}

export interface TaxRule {
  id: string;
  name: string;
  type: "percentage" | "fixed";
  rate: number;
  applicableProducts: string[]; // ["all"] or list of product IDs
  isInclusive: boolean;
  active: boolean;
  createdAt?: string;
}

export interface DiscountRule {
  id: string;
  code: string;
  name: string;
  type: "percentage" | "fixed";
  value: number;
  minPurchaseAmount?: number;
  minQuantity?: number;
  startDate: string;
  endDate: string;
  usageLimit?: number;
  usageCount: number;
  scope: "subscription" | "product";
  applicableProducts?: string[];
  active: boolean;
  createdAt?: string;
}

export interface InvoiceLine {
  id: string;
  invoiceId: string;
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxAmount?: number;
  discountAmount?: number;
  amount: number;
}

export interface InvoiceTaxBreakdown {
  name: string;
  rate: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  subscriptionId?: string;
  periodKey?: string; // Idempotency key: subId_periodStart_periodEnd
  customerId: string;
  customer?: Customer;
  issueDate: string;
  dueDate: string;
  daysOverdue: number;
  subtotal?: number;
  taxTotal?: number;
  discountTotal?: number;
  taxBreakdown?: InvoiceTaxBreakdown[];
  discountCode?: string;
  totalAmount: number;
  balance: number;
  paidAmount?: number;
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
  note?: string;
  paymentDate: string;
  createdAt: string;
}

export interface BillingRun {
  id: string;
  runDate: string;
  runBy: string;
  subscriptionsProcessed: number;
  invoicesCreated: number;
  invoicesSkipped: number;
  failedCount: number;
  errors: string[];
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
