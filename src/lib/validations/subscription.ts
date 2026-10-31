/**
 * Subscription Domain Validation Schemas
 *
 * Single source of truth for Product, ProductVariant, Plan, QuotationTemplate,
 * Subscription and SubscriptionLine. Domain types are inferred from these
 * schemas and re-exported through `src/types/subscription.ts`.
 *
 * Conventions:
 * - Money is expressed in major currency units (e.g. 49.99) and is never negative.
 * - Dates are ISO 8601 strings ("YYYY-MM-DD" or a full timestamp).
 * - Prices are validated non-negative, quantities are whole numbers >= 1.
 */
import { z } from "zod";

/* -------------------------------------------------------------------------- */
/* Enumerations                                                               */
/* -------------------------------------------------------------------------- */

export const PRODUCT_TYPES = ["goods", "service"] as const;

export const BILLING_PERIODS = ["daily", "weekly", "monthly", "yearly"] as const;

export const PAYMENT_TERMS = ["immediate", "net_15", "net_30", "net_60"] as const;

export const SUBSCRIPTION_STATUSES = [
  "draft",
  "quotation",
  "confirmed",
  "active",
  "paused",
  "closed",
] as const;

export const productTypeSchema = z.enum(PRODUCT_TYPES);

export const billingPeriodSchema = z.enum(BILLING_PERIODS);

export const paymentTermsSchema = z.enum(PAYMENT_TERMS);

export const subscriptionStatusSchema = z.enum(SUBSCRIPTION_STATUSES);

/* -------------------------------------------------------------------------- */
/* Reusable field schemas                                                     */
/* -------------------------------------------------------------------------- */

/** A reference id (Supabase UUID or generated text id) of a related record. */
const idSchema = z.string().trim().min(1, "A reference id is required");

const moneySchema = z.number().min(0, "Amount cannot be negative");

const quantitySchema = z
  .number()
  .int("Quantity must be a whole number")
  .min(1, "Quantity must be at least 1");

const isoDateSchema = z
  .string()
  .trim()
  .min(1, "Date is required")
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "Date must be a valid ISO 8601 date",
  });

const optionalIsoDateSchema = isoDateSchema.nullish();

/** True when `later` is strictly after `earlier`, or when either side is absent. */
function isAfter(
  later: string | null | undefined,
  earlier: string | null | undefined,
): boolean {
  if (!later || !earlier) {
    return true;
  }

  return Date.parse(later) > Date.parse(earlier);
}

/* -------------------------------------------------------------------------- */
/* Product                                                                    */
/* -------------------------------------------------------------------------- */

export const productSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Product name is required")
    .max(120, "Product name is too long"),
  type: productTypeSchema,
  salesPrice: moneySchema,
  costPrice: moneySchema,
  notes: z.string().trim().max(2000, "Notes are too long").optional(),
});

/* -------------------------------------------------------------------------- */
/* Product variant                                                            */
/* -------------------------------------------------------------------------- */

export const productVariantSchema = z.object({
  productId: idSchema,
  attribute: z
    .string()
    .trim()
    .min(1, "Attribute is required")
    .max(60, "Attribute is too long"),
  value: z
    .string()
    .trim()
    .min(1, "Variant value is required")
    .max(120, "Variant value is too long"),
  extraPrice: moneySchema,
});

/* -------------------------------------------------------------------------- */
/* Plan                                                                       */
/* -------------------------------------------------------------------------- */

export const planSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Plan name is required")
      .max(120, "Plan name is too long"),
    price: moneySchema,
    billingPeriod: billingPeriodSchema,
    minQuantity: quantitySchema.default(1),
    availableFrom: optionalIsoDateSchema,
    availableTo: optionalIsoDateSchema,
    autoClose: z.boolean().default(false),
    closable: z.boolean().default(true),
    pausable: z.boolean().default(true),
    renewable: z.boolean().default(true),
  })
  .refine((plan) => isAfter(plan.availableTo, plan.availableFrom), {
    message: "availableTo must be after availableFrom",
    path: ["availableTo"],
  });

/* -------------------------------------------------------------------------- */
/* Subscription line                                                          */
/* -------------------------------------------------------------------------- */

export const subscriptionLineSchema = z.object({
  productId: idSchema,
  variantId: idSchema.optional(),
  quantity: quantitySchema,
  unitPrice: moneySchema,
  taxId: idSchema.optional(),
  amount: moneySchema,
});

/* -------------------------------------------------------------------------- */
/* Quotation template                                                         */
/* -------------------------------------------------------------------------- */

export const quotationTemplateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Quotation template name is required")
    .max(120, "Quotation template name is too long"),
  planId: idSchema,
  validityDays: z
    .number()
    .int("Validity days must be a whole number")
    .gt(0, "Validity days must be greater than 0"),
  lines: z
    .array(subscriptionLineSchema)
    .min(1, "A quotation template needs at least one line"),
});

/* -------------------------------------------------------------------------- */
/* Subscription                                                               */
/* -------------------------------------------------------------------------- */

/** Base subscription object (shared by read schema and create schema). */
const subscriptionBaseSchema = z.object({
  number: z.string().trim().min(1, "Subscription number is required").max(40, "Subscription number is too long"),
  customerId: idSchema,
  planId: idSchema,
  startDate: isoDateSchema,
  expiryDate: isoDateSchema,
  paymentTerms: paymentTermsSchema,
  status: subscriptionStatusSchema.default("draft"),
  nextBillingDate: optionalIsoDateSchema,
  lines: z.array(subscriptionLineSchema).min(1, "A subscription needs at least one line"),
});

function expiryAfterStart(s: { startDate: string; expiryDate: string }): boolean {
  return isAfter(s.expiryDate, s.startDate);
}
const expiryIssue = { message: "expiryDate must be after startDate", path: ["expiryDate"] };

/** Full record, used when reading an existing subscription. */
export const subscriptionSchema = subscriptionBaseSchema.refine(expiryAfterStart, expiryIssue);

/**
 * Payload for creating a subscription from a form.
 * number is generated by DB; status defaults to draft; nextBillingDate set on activation.
 */
export const subscriptionCreateSchema = subscriptionBaseSchema
  .omit({ number: true, status: true, nextBillingDate: true })
  .refine(expiryAfterStart, expiryIssue);

/* -------------------------------------------------------------------------- */
/* Inferred domain types                                                      */
/* -------------------------------------------------------------------------- */

export type ProductType = z.infer<typeof productTypeSchema>;
export type BillingPeriod = z.infer<typeof billingPeriodSchema>;
export type PaymentTerms = z.infer<typeof paymentTermsSchema>;
export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>;

export type Product = z.infer<typeof productSchema>;
export type ProductVariant = z.infer<typeof productVariantSchema>;
export type Plan = z.infer<typeof planSchema>;
export type SubscriptionLine = z.infer<typeof subscriptionLineSchema>;
export type QuotationTemplate = z.infer<typeof quotationTemplateSchema>;
export type Subscription = z.infer<typeof subscriptionSchema>;
export type SubscriptionCreate = z.infer<typeof subscriptionCreateSchema>;

