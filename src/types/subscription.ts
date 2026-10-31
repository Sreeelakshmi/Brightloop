/**
 * Subscription Domain Types
 *
 * The Zod schemas in `src/lib/validations/subscription.ts` are the source of
 * truth. These types are inferred from those schemas so forms, services and UI
 * stay in sync with server-side validation.
 */

import type { Subscription } from "@/lib/validations/subscription";

export type {
  BillingPeriod,
  PaymentTerms,
  Plan,
  Product,
  ProductType,
  ProductVariant,
  QuotationTemplate,
  Subscription,
  SubscriptionLine,
  SubscriptionStatus,
} from "@/lib/validations/subscription";

/**
 * Subscription as consumed by the recurring billing engine.
 *
 * Only a contract that has been activated is billable, so `status` is narrowed
 * to `"active"` and `nextBillingDate` is guaranteed to be present. The totals
 * are the aggregates the engine invoices for the current cycle.
 */
export interface BillableSubscription extends Subscription {
  status: "active";
  nextBillingDate: string;
  /** Sum of the line amounts before tax. */
  subtotal: number;
  /** Sum of the tax amounts for the lines. */
  taxTotal: number;
  /** `subtotal` + `taxTotal`, i.e. what the customer is charged. */
  totalAmount: number;
}
