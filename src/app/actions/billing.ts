"use server";

import { revalidatePath } from "next/cache";
import { recordPayment, processDemoPayment } from "@/services/payments";
import { updateInvoiceStatus, createInvoice } from "@/services/invoices";
import { createTaxRule } from "@/services/taxes";
import { createDiscount } from "@/services/discounts";
import { runRecurringBilling } from "@/services/recurring";
import {
  recordPaymentSchema,
  createTaxRuleSchema,
  createDiscountSchema,
  createManualInvoiceSchema,
  processDemoPaymentSchema,
  RecordPaymentInput,
  CreateTaxRuleInput,
  CreateDiscountInput,
  CreateManualInvoiceSchemaInput,
  ProcessDemoPaymentInput,
} from "@/lib/validations/billing";
import { ExtendedInvoiceStatus } from "@/types";
import { rupeesToPaise } from "@/lib/billing/math";

export async function recordPaymentAction(formData: RecordPaymentInput) {
  try {
    const validated = recordPaymentSchema.parse(formData);
    const result = await recordPayment(validated);
    revalidatePath("/invoices");
    revalidatePath("/payments");
    revalidatePath(`/invoices/${validated.invoiceId}`);
    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to record payment" };
  }
}

export async function updateInvoiceStatusAction(
  invoiceId: string,
  status: ExtendedInvoiceStatus
) {
  try {
    const updated = await updateInvoiceStatus(invoiceId, status);
    revalidatePath("/invoices");
    revalidatePath(`/invoices/${invoiceId}`);
    return { success: true, data: updated };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update invoice status" };
  }
}

export async function runRecurringBillingAction() {
  try {
    const result = await runRecurringBilling();
    revalidatePath("/invoices");
    revalidatePath("/payments");
    revalidatePath("/dashboard");
    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to run recurring billing" };
  }
}

export async function createTaxRuleAction(input: CreateTaxRuleInput) {
  try {
    const validated = createTaxRuleSchema.parse(input);
    const created = await createTaxRule(validated);
    revalidatePath("/settings");
    revalidatePath("/invoices");
    return { success: true, data: created };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to create tax rule" };
  }
}

export async function createDiscountAction(input: CreateDiscountInput) {
  try {
    const validated = createDiscountSchema.parse(input);
    const created = await createDiscount(validated);
    revalidatePath("/settings");
    revalidatePath("/invoices");
    return { success: true, data: created };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to create discount" };
  }
}

export async function createManualInvoiceAction(input: CreateManualInvoiceSchemaInput) {
  try {
    const validated = createManualInvoiceSchema.parse(input);
    const newInvoice = await createInvoice({
      customerId: validated.customerId || "",
      customerName: validated.customerName,
      customerEmail: validated.customerEmail,
      dueDate: validated.dueDate,
      notes: validated.notes,
      status: "confirmed",
      items: validated.items.map((it) => ({
        description: it.description,
        quantity: it.quantity,
        unitPricePaise: rupeesToPaise(it.unitPriceRupees),
        taxRatePercent: it.taxRatePercent ?? 18,
        discountCode: it.discountCode,
        productId: it.productId,
      })),
    });

    revalidatePath("/invoices");
    revalidatePath("/payments");
    revalidatePath("/dashboard");
    return { success: true, data: newInvoice };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to create invoice" };
  }
}

export async function processDemoPaymentAction(formData: ProcessDemoPaymentInput) {
  try {
    const validated = processDemoPaymentSchema.parse(formData);
    const result = await processDemoPayment(validated);

    if (result.success) {
      revalidatePath("/invoices");
      revalidatePath("/payments");
      revalidatePath(`/invoices/${validated.invoiceId}`);
      revalidatePath("/dashboard");
    }

    return { success: result.success, data: result, error: result.error };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to process demo payment" };
  }
}
