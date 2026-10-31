/**
 * Brightloop Shared TypeScript Type Definitions
 *
 * Core entities and shared domain vocabulary across hackathon team members.
 * Subscription-domain types (Product, ProductVariant, Plan, QuotationTemplate,
 * Subscription, SubscriptionLine) are defined in `./subscription` and
 * re-exported here.
 */

export type UserRole = "owner" | "admin" | "finance" | "support" | "customer";

/** Billing cycle used by invoicing (subscription plans use `BillingPeriod`). */
export type BillingInterval = "month" | "quarter" | "year";

export type InvoiceStatus =
  | "draft"
  | "open"
  | "paid"
  | "uncollectible"
  | "void";

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
}

export interface Customer {
  id: string;
  organizationId: string;
  email: string;
  name: string;
  phone?: string;
  createdAt: string;
}

export interface Staff {
  id: string;
  organizationId: string;
  userId: string;
  role: UserRole;
  email: string;
  fullName: string;
  createdAt: string;
}

export interface Quotation {
  id: string;
  customerId: string;
  status: QuotationStatus;
  totalAmount: number;
  currency: string;
  expiresAt: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  subscriptionId?: string;
  customerId: string;
  status: InvoiceStatus;
  amountDue: number;
  amountPaid: number;
  currency: string;
  dueDate: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: string;
  createdAt: string;
}

/* Subscription domain: products, variants, plans, quotations, subscriptions. */
export * from "./subscription";
