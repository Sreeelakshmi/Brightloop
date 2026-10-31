"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createProduct, updateProduct, toggleArchiveProduct } from "@/lib/services/products";
import { createPlan } from "@/lib/services/plans";
import { createQuotationTemplate, createQuotationFromTemplate } from "@/lib/services/quotations";
import {
  createSubscription,
  transitionSubscription,
  pauseSubscription,
  closeEarlySubscription,
  renewSubscription,
  runScheduler,
} from "@/lib/services/subscriptions";
import { createTaxRule } from "@/lib/services/taxes";
import { createDiscountRule } from "@/lib/services/discounts";
import { runBillingEngine } from "@/lib/services/billing";
import { confirmInvoice, cancelInvoice, sendInvoiceEmail, sendOverdueReminder } from "@/lib/services/invoices";
import { recordPayment } from "@/lib/services/payments";
import { resetMockDb } from "@/lib/mock/db";
import { PaymentMethod, SubscriptionStatus } from "@/types";

export async function handleCreateProduct(data: {
  name: string;
  type: "service" | "consumable" | "storable";
  salesPrice: number;
  costPrice: number;
  notes?: string;
  variants?: Array<{ attributeName: string; attributeValue: string; extraPrice: number }>;
}) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  try {
    const product = await createProduct(data, user.role);
    revalidatePath("/products");
    return { success: true, product };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function handleToggleArchiveProduct(productId: string, archived: boolean) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  try {
    await toggleArchiveProduct(productId, archived, user.role);
    revalidatePath("/products");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function handleCreatePlan(data: {
  name: string;
  code: string;
  billingPeriod: import("@/types").PlanBillingPeriod;
  amount: number;
  description?: string;
  minimumQuantity?: number;
  availableFrom?: string;
  availableTo?: string;
  autoClose?: boolean;
  closableEarly?: boolean;
  pausable?: boolean;
  renewable?: boolean;
}) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  try {
    const plan = await createPlan(data, user.role);
    revalidatePath("/plans");
    return { success: true, plan };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function handleCreateQuotationTemplate(data: {
  name: string;
  validityDays: number;
  planId: string;
  lines: Array<{ productId: string; variantId?: string; quantity: number; unitPrice: number }>;
}) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  try {
    const tmpl = await createQuotationTemplate(data, user.role);
    revalidatePath("/quotation-templates");
    return { success: true, template: tmpl };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function handleCreateQuotationFromTemplate(templateId: string, customerId: string) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  try {
    const sub = await createQuotationFromTemplate(templateId, customerId, {
      name: user.name,
      role: user.role,
    });
    revalidatePath("/subscriptions");
    revalidatePath("/quotations");
    return { success: true, subscription: sub };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}


export async function handleCreateSubscription(data: {
  customerId: string;
  planId: string;
  startDate: string;
  paymentTerms?: string;
  lines: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
    unitPrice: number;
  }>;
}) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  try {
    const sub = await createSubscription(data, {
      name: user.name,
      role: user.role,
    });
    revalidatePath("/subscriptions");
    return { success: true, subscription: sub };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function handleTransitionSubscription(
  subscriptionId: string,
  targetStatus: SubscriptionStatus,
  reason?: string
) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  try {
    const sub = await transitionSubscription(
      subscriptionId,
      targetStatus,
      { name: user.name, role: user.role },
      reason
    );
    revalidatePath("/subscriptions");
    revalidatePath(`/subscriptions/${subscriptionId}`);
    revalidatePath("/portal/subscriptions");
    revalidatePath(`/portal/subscriptions/${subscriptionId}`);
    return { success: true, subscription: sub };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function handlePauseSubscription(subscriptionId: string) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  try {
    const sub = await pauseSubscription(subscriptionId, {
      name: user.name,
      role: user.role,
      customerId: user.customerId,
    });
    revalidatePath("/subscriptions");
    revalidatePath(`/subscriptions/${subscriptionId}`);
    revalidatePath("/portal/subscriptions");
    revalidatePath(`/portal/subscriptions/${subscriptionId}`);
    return { success: true, subscription: sub };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function handleCloseEarlySubscription(subscriptionId: string) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  try {
    const sub = await closeEarlySubscription(subscriptionId, {
      name: user.name,
      role: user.role,
      customerId: user.customerId,
    });
    revalidatePath("/subscriptions");
    revalidatePath(`/subscriptions/${subscriptionId}`);
    revalidatePath("/portal/subscriptions");
    revalidatePath(`/portal/subscriptions/${subscriptionId}`);
    return { success: true, subscription: sub };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function handleRenewSubscription(subscriptionId: string) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  try {
    const sub = await renewSubscription(subscriptionId, {
      name: user.name,
      role: user.role,
      customerId: user.customerId,
    });
    revalidatePath("/subscriptions");
    revalidatePath(`/subscriptions/${subscriptionId}`);
    revalidatePath("/portal/subscriptions");
    revalidatePath(`/portal/subscriptions/${subscriptionId}`);
    return { success: true, subscription: sub };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function handleRunScheduler() {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  try {
    const res = await runScheduler(user.role);
    revalidatePath("/subscriptions");
    revalidatePath("/dashboard");
    return { success: true, ...res };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function handleRunBillingEngine() {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  try {
    const res = await runBillingEngine({ name: user.name, role: user.role });
    revalidatePath("/invoices");
    revalidatePath("/billing-runs");
    revalidatePath("/dashboard");
    revalidatePath("/reports");
    return { success: true, billingRun: res };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function handleConfirmInvoice(invoiceId: string) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  try {
    const inv = await confirmInvoice(invoiceId, { name: user.name, role: user.role });
    revalidatePath("/invoices");
    revalidatePath(`/invoices/${invoiceId}`);
    return { success: true, invoice: inv };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function handleCancelInvoice(invoiceId: string) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  try {
    const inv = await cancelInvoice(invoiceId, { name: user.name, role: user.role });
    revalidatePath("/invoices");
    revalidatePath(`/invoices/${invoiceId}`);
    return { success: true, invoice: inv };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function handleSendInvoiceEmail(invoiceId: string) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  try {
    const res = await sendInvoiceEmail(invoiceId, { name: user.name, role: user.role });
    revalidatePath("/dev-mailbox");
    return { success: true, emailTo: res.emailTo };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function handleSendOverdueReminder(invoiceId: string) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  try {
    const res = await sendOverdueReminder(invoiceId, { name: user.name, role: user.role });
    revalidatePath("/dev-mailbox");
    return { success: true, emailTo: res.emailTo };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function handleRecordPayment(data: {
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  paymentDate?: string;
  reference?: string;
  note?: string;
}) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  try {
    const payment = await recordPayment(data, { name: user.name, role: user.role });
    revalidatePath("/payments");
    revalidatePath("/invoices");
    revalidatePath(`/invoices/${data.invoiceId}`);
    revalidatePath("/dashboard");
    revalidatePath("/reports");
    return { success: true, payment };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function handleCreateTaxRule(data: {
  name: string;
  type: "percentage" | "fixed";
  rate: number;
  applicableProducts?: string[];
  isInclusive?: boolean;
}) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  try {
    const tax = await createTaxRule(data, user.role);
    revalidatePath("/taxes");
    return { success: true, tax };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function handleCreateDiscountRule(data: {
  code: string;
  name: string;
  type: "percentage" | "fixed";
  value: number;
  minPurchaseAmount?: number;
  minQuantity?: number;
  startDate: string;
  endDate: string;
  usageLimit?: number;
  scope: "subscription" | "product";
  applicableProducts?: string[];
}) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  try {
    const disc = await createDiscountRule(data, user.role);
    revalidatePath("/discounts");
    return { success: true, discount: disc };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function handleResetDemoData() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return { success: false, error: "Only admins can reset demo data" };
  }

  try {
    resetMockDb();
    revalidatePath("/dashboard");
    revalidatePath("/subscriptions");
    revalidatePath("/invoices");
    revalidatePath("/payments");
    revalidatePath("/reports");
    revalidatePath("/portal");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}
