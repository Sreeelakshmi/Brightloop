import { z } from "zod";

export const recordPaymentSchema = z.object({
  invoiceId: z.string().min(1, "Invoice ID is required"),
  customerId: z.string().min(1, "Customer ID is required"),
  amountRupees: z.number().positive("Payment amount must be greater than zero"),
  paymentMethod: z.enum([
    "card",
    "upi",
    "net_banking",
    "bank_transfer",
    "cash",
    "manual",
  ]),
  transactionReference: z.string().optional(),
  notes: z.string().optional(),
});

export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;

export const createTaxRuleSchema = z.object({
  name: z.string().min(2, "Tax rule name must be at least 2 characters"),
  code: z.string().min(2, "Code must be at least 2 characters").toUpperCase(),
  rate: z
    .number()
    .min(0, "Rate cannot be negative")
    .max(100, "Rate cannot exceed 100%"),
  description: z.string().optional(),
  country: z.string().default("IN"),
  state: z.string().optional(),
});

export type CreateTaxRuleInput = z.infer<typeof createTaxRuleSchema>;

export const createDiscountSchema = z.object({
  code: z.string().min(2, "Discount code must be at least 2 characters").toUpperCase(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  type: z.enum(["percentage", "fixed"]),
  value: z.number().positive("Discount value must be greater than zero"),
  minPurchaseAmount: z.number().min(0).default(0),
  minQuantity: z.number().int().min(1).default(1),
  maxUsage: z.number().int().positive().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type CreateDiscountInput = z.infer<typeof createDiscountSchema>;

export const triggerRecurringBillingSchema = z.object({
  dryRun: z.boolean().optional().default(false),
  targetDate: z.string().optional(),
});

export type TriggerRecurringBillingInput = z.infer<typeof triggerRecurringBillingSchema>;

export const createManualInvoiceSchema = z.object({
  customerName: z.string().min(2, "Customer name must be at least 2 characters"),
  customerEmail: z.string().email("Please provide a valid email address"),
  customerId: z.string().optional(),
  dueDate: z.string().min(1, "Due date is required"),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        description: z.string().min(2, "Item description is required"),
        quantity: z.number().int().positive("Quantity must be at least 1"),
        unitPriceRupees: z.number().positive("Unit price must be greater than zero"),
        taxRatePercent: z.number().min(0).max(100).optional().default(18),
        discountCode: z.string().optional(),
        productId: z.string().optional(),
      })
    )
    .min(1, "At least one line item is required"),
});

export type CreateManualInvoiceSchemaInput = z.infer<typeof createManualInvoiceSchema>;

export const processDemoPaymentSchema = z.object({
  invoiceId: z.string().min(1, "Invoice ID is required"),
  customerId: z.string().min(1, "Customer ID is required"),
  amountRupees: z.number().positive("Payment amount must be greater than zero"),
  paymentMethod: z.enum([
    "card",
    "upi",
    "net_banking",
    "debit_card",
  ]),
  demoOutcome: z.enum(["success", "failure"]),
  failureReason: z.string().optional(),
  simulatedDetails: z
    .object({
      upiVpa: z.string().optional(),
      cardLast4: z.string().optional(),
      cardBrand: z.string().optional(),
      bankName: z.string().optional(),
    })
    .optional(),
});

export type ProcessDemoPaymentInput = z.infer<typeof processDemoPaymentSchema>;
