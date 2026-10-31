/**
 * Brightloop Shared TypeScript Type Definitions
 *
 * Core entities and shared domain vocabulary across hackathon team members.
 * Subscription-domain types (Product, ProductVariant, Plan, QuotationTemplate,
 * Subscription, SubscriptionLine) are defined in `./subscription` and
 * re-exported here.
 */

export type UserRole = "owner" | "admin" | "staff" | "finance" | "support" | "customer";

/** Billing cycle used by invoicing (subscription plans use `BillingPeriod`). */
export type BillingInterval = "month" | "quarter" | "year";

export type InvoiceStatus =
  | "draft"
  | "open"
  | "paid"
  | "uncollectible"
  | "void"
  | "overdue"
  | "confirmed"
  | "cancelled"
  | "closed";

export type QuotationStatus =
  | "draft"
  | "sent"
  | "accepted"
  | "rejected"
  | "expired";

export type PaymentStatus =
  | "pending"
  | "succeeded"
  | "failed"
  | "refunded";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  currency: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Profile {
  id: string;
  organizationId?: string | null;
  email: string;
  fullName?: string | null;
  avatarUrl?: string | null;
  phone?: string | null;
  role: UserRole;
  billingAddress?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
}

export interface Customer {
  id: string;
  organizationId?: string | null;
  email: string;
  name?: string | null;
  phone?: string | null;
  company?: string;
  address?: string;
  taxId?: string;
  createdAt: string;
}

export interface Staff {
  id: string;
  organizationId?: string | null;
  userId: string;
  role: UserRole;
  email: string;
  fullName?: string | null;
  createdAt: string;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  customerId: string;
  status: QuotationStatus;
  currency: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string | null;
  validUntil: string;
  createdBy?: string | null;
  createdAt: string;
  updatedAt?: string;
  items?: QuotationItem[];
}

export interface QuotationItem {
  id: string;
  quotationId: string;
  planId?: string | null;
  productVariantId?: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber?: string;
  invoiceNo?: string;
  customerId: string;
  customer?: any;
  customerName?: string;
  customerEmail?: string;
  subscriptionId?: string | null;
  billingPeriodStart?: string | null;
  billingPeriodEnd?: string | null;
  issueDate?: string;
  dueDate: string;
  daysOverdue?: number;
  status: InvoiceStatus;
  extendedStatus?: any;
  currency: string;
  subtotal?: number;
  taxAmount?: number;
  discountAmount?: number;
  totalAmount?: number;
  balance?: number;
  amountDue?: number;
  amountPaid?: number;
  paidAt?: string | null;
  voidedAt?: string | null;
  pdfUrl?: string | null;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  items?: any[];
  lines?: any[];
  payments?: any[];
}

export interface Payment {
  id: string;
  paymentNo?: string;
  invoiceId: string;
  invoiceNo?: string;
  customerId: string;
  customer?: any;
  transactionReference?: string | null;
  reference?: string;
  paymentMethod: string;
  method?: any;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentDate?: string;
  errorMessage?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
}

/* Subscription domain: products, variants, plans, quotations, subscriptions. */
export * from "./subscription";

/* Billing domain: invoices, taxes, discounts, payments, financial math. */
export * from "./billing";

/* Telemetry, Dashboard, and Portal domain. */
export * from "./telemetry";
