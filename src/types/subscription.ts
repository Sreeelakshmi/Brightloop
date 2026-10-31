/**
 * Subscription Domain Types
 *
 * The Zod schemas in `src/lib/validations/subscription.ts` are the source of
 * truth. These types are inferred from those schemas so forms, services and UI
 * stay in sync with server-side validation.
 */

import type {
  BillingPeriod,
  Subscription as BaseSubscription,
  SubscriptionLine as BaseSubscriptionLine,
  Plan as BasePlan,
  SubscriptionStatus,
} from "@/lib/validations/subscription";

export type {
  BillingPeriod,
  PaymentTerms,
  Product,
  ProductType,
  ProductVariant,
  QuotationTemplate,
  SubscriptionCreate,
  SubscriptionStatus,
} from "@/lib/validations/subscription";

export type Plan = BasePlan & {
  id?: string;
  code?: string;
  billingCycle?: any;
  amount?: number;
  currency?: string;
  description?: string;
  active?: boolean;
};

export type SubscriptionLine = BaseSubscriptionLine & {
  id?: string;
  subscriptionId?: string;
  description?: string;
};

export type Subscription = BaseSubscription & {
  id?: string;
  subscriptionNumber?: string;
  number?: string;
  endDate?: string;
  renewalDate?: string;
  totalAmount?: number;
  currency?: string;
  customer?: any;
  plan?: any;
  lines?: SubscriptionLine[];
  createdAt?: string;
};

export interface BillableSubscriptionLine extends BaseSubscriptionLine {
  id?: string;
  lineId?: string;
  productName?: string;
}

/**
 * Subscription as consumed by the recurring billing engine.
 */
export interface BillableSubscription extends BaseSubscription {
  id: string;
  subscriptionId?: string;
  status: "active";
  nextBillingDate: string;
  periodStart: string;
  periodEnd: string;
  planName?: string;
  billingPeriod?: BillingPeriod;
  customerName?: string | null;
  customerEmail?: string | null;
  lines: BillableSubscriptionLine[];
  /** Sum of the line amounts before tax. */
  subtotal: number;
  /** Sum of the tax amounts for the lines. */
  taxTotal: number;
  /** `subtotal` + `taxTotal`, i.e. what the customer is charged. */
  totalAmount: number;
}
