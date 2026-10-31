/**
 * Brightloop Shared TypeScript Type Definitions
 *
 * Core entities and shared domain vocabulary across hackathon team members.
 */

export type UserRole = "admin" | "staff" | "customer";

export type BillingInterval = "month" | "quarter" | "year";

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "paused";

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

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  active: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  sku?: string | null;
  description?: string | null;
  active: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
}

export interface Plan {
  id: string;
  productId: string;
  name: string;
  code: string;
  description?: string | null;
  interval: BillingInterval;
  intervalCount?: number;
  amount: number;
  currency: string;
  trialDays?: number;
  active: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
}

export interface TaxRule {
  id: string;
  name: string;
  country?: string | null;
  region?: string | null;
  percentage: number;
  isInclusive: boolean;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface DiscountRule {
  id: string;
  code: string;
  description?: string | null;
  discountType: "percentage" | "fixed_amount";
  discountValue: number;
  currency?: string | null;
  maxRedemptions?: number | null;
  timesRedeemed: number;
  startsAt?: string | null;
  expiresAt?: string | null;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Customer {
  id: string;
  organizationId?: string | null;
  email: string;
  name?: string | null;
  phone?: string | null;
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

export interface Subscription {
  id: string;
  customerId: string;
  planId: string;
  quotationId?: string | null;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialStart?: string | null;
  trialEnd?: string | null;
  cancelAtPeriodEnd: boolean;
  canceledAt?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
  items?: SubscriptionItem[];
}

export interface SubscriptionItem {
  id: string;
  subscriptionId: string;
  productVariantId?: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  subscriptionId?: string | null;
  billingPeriodStart?: string | null;
  billingPeriodEnd?: string | null;
  status: InvoiceStatus;
  currency: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  amountDue: number;
  amountPaid: number;
  dueDate: string;
  paidAt?: string | null;
  voidedAt?: string | null;
  pdfUrl?: string | null;
  createdAt: string;
  updatedAt?: string;
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  productVariantId?: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  createdAt: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  customerId: string;
  transactionReference?: string | null;
  paymentMethod: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  errorMessage?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
}
