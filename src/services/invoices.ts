import {
  DetailedInvoice,
  InvoiceItem,
  ExtendedInvoiceStatus,
  InvoiceStatus,
  BillingAnalyticsSummary,
} from "@/types";
import {
  rupeesToPaise,
  paiseToRupees,
  calculateInvoiceTotals,
  LineItemCalculationInput,
} from "@/lib/billing/math";
import { evaluateDiscountEligibility, getDiscountByCode, incrementDiscountUsage } from "./discounts";
import { createServerClient } from "@/lib/supabase/server";

export function toBaseInvoiceStatus(extended: ExtendedInvoiceStatus): InvoiceStatus {
  switch (extended) {
    case "paid":
      return "paid";
    case "draft":
      return "draft";
    case "cancelled":
      return "void";
    case "confirmed":
    case "overdue":
    default:
      return "open";
  }
}

// Helper to determine derived status (e.g. overdue)
export function resolveInvoiceStatus(
  status: ExtendedInvoiceStatus,
  dueDateStr: string,
  amountDuePaise: number
): ExtendedInvoiceStatus {
  if (status === "paid" || status === "cancelled" || status === "draft") {
    return status;
  }
  const isPastDue = new Date(dueDateStr) < new Date();
  if (isPastDue && amountDuePaise > 0) {
    return "overdue";
  }
  return status;
}

export const KNOWN_SEED_CUSTOMERS: Record<string, { name: string; email: string }> = {
  "a0000000-0000-4000-8000-000000000001": { name: "Astra Tech Solutions", email: "billing@astratech.in" },
  "a0000000-0000-4000-8000-000000000002": { name: "Nexora Analytics", email: "finance@nexora.io" },
  "a0000000-0000-4000-8000-000000000003": { name: "Kite Fintech Labs", email: "accounts@kitefintech.com" },
  "a0000000-0000-4000-8000-000000000004": { name: "CloudScale Systems", email: "ops@cloudscale.net" },
  "a0000000-0000-4000-8000-000000000005": { name: "Zenith Retail Tech", email: "pay@zenithretail.in" },
  "a0000000-0000-4000-8000-000000000006": { name: "Bytecraft Software", email: "contact@bytecraft.dev" },
  "a0000000-0000-4000-8000-000000000007": { name: "Orbit Logistics", email: "accounts@orbitlogistics.co" },
  "a0000000-0000-4000-8000-000000000008": { name: "Quantum AI Dynamics", email: "billing@quantumai.dev" },
  "a0000000-0000-4000-8000-000000000009": { name: "Hyperion Cloud", email: "finance@hyperioncloud.io" },
  "a0000000-0000-4000-8000-000000000010": { name: "Solaria Energy", email: "accounts@solaria.energy" },
};

export interface CustomerOption {
  id: string;
  name: string;
  email: string;
}

export async function getCustomerOptions(): Promise<CustomerOption[]> {
  try {
    const client = await createServerClient();
    if (client) {
      const { data, error } = await client
        .from("profiles")
        .select("id, full_name, email")
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((d: any) => ({
          id: d.id,
          name: d.full_name || d.name || d.email,
          email: d.email,
        }));
      }
    }
  } catch {
    // Fall back to seed customers
  }

  return Object.entries(KNOWN_SEED_CUSTOMERS).map(([id, info]) => ({
    id,
    name: info.name,
    email: info.email,
  }));
}

function mapDbInvoice(row: any): DetailedInvoice {
  const subtotalPaise = rupeesToPaise(Number(row.subtotal ?? 0));
  const discountTotalPaise = rupeesToPaise(Number(row.discount_amount ?? row.discount_total ?? 0));
  const taxTotalPaise = rupeesToPaise(Number(row.tax_amount ?? row.tax_total ?? 0));

  const totalAmountPaise =
    row.total_amount != null
      ? rupeesToPaise(Number(row.total_amount))
      : Math.max(0, subtotalPaise - discountTotalPaise + taxTotalPaise);

  const amountPaidPaise = rupeesToPaise(Number(row.amount_paid ?? 0));
  const amountDuePaise =
    row.amount_due != null
      ? rupeesToPaise(Number(row.amount_due))
      : Math.max(0, totalAmountPaise - amountPaidPaise);

  const items: InvoiceItem[] = (row.invoice_items ?? []).map((item: any) => ({
    id: item.id,
    invoiceId: item.invoice_id,
    productId: item.product_id ?? undefined,
    description: item.description,
    quantity: Number(item.quantity ?? 1),
    unitPricePaise: rupeesToPaise(Number(item.unit_price ?? 0)),
    subtotalPaise: rupeesToPaise(
      Number(item.subtotal ?? Number(item.quantity ?? 1) * Number(item.unit_price ?? 0))
    ),
    discountAmountPaise: rupeesToPaise(Number(item.discount_amount ?? 0)),
    taxRatePercent: Number(item.tax_rate ?? 18),
    taxAmountPaise: rupeesToPaise(Number(item.tax_amount ?? 0)),
    totalAmountPaise: rupeesToPaise(Number(item.total_amount ?? 0)),
    metadata: item.metadata,
    createdAt: item.created_at,
  }));

  const payments = (row.payments ?? []).map((p: any) => ({
    id: p.id,
    invoiceId: p.invoice_id,
    customerId: p.customer_id,
    amount: Number(p.amount ?? 0),
    amountPaise: rupeesToPaise(Number(p.amount ?? 0)),
    currency: p.currency ?? "INR",
    status: p.status,
    paymentMethod: p.payment_method,
    paymentMethodType: p.payment_method,
    paymentDate: p.payment_date || p.created_at,
    transactionReference: p.transaction_reference,
    notes: p.notes,
    createdAt: p.created_at,
  }));

  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  const customerName =
    profile?.full_name ??
    profile?.name ??
    row.customer?.full_name ??
    row.customer?.name ??
    KNOWN_SEED_CUSTOMERS[row.customer_id]?.name ??
    undefined;
  const customerEmail =
    profile?.email ??
    row.customer?.email ??
    KNOWN_SEED_CUSTOMERS[row.customer_id]?.email ??
    undefined;

  const rawStatus = (row.status ?? "draft") as ExtendedInvoiceStatus;
  const extendedStatus = resolveInvoiceStatus(rawStatus, row.due_date, amountDuePaise);

  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    customerId: row.customer_id,
    customerName,
    customerEmail,
    subscriptionId: row.subscription_id ?? undefined,
    status: toBaseInvoiceStatus(extendedStatus),
    extendedStatus,
    currency: row.currency ?? "INR",
    issueDate: row.issue_date || row.created_at,
    dueDate: row.due_date,
    periodStart: row.billing_period_start || row.period_start || undefined,
    periodEnd: row.billing_period_end || row.period_end || undefined,
    subtotalPaise,
    discountTotalPaise,
    taxTotalPaise,
    totalAmountPaise,
    amountPaidPaise,
    amountDuePaise,
    amountDue: Number(row.amount_due ?? paiseToRupees(amountDuePaise)),
    amountPaid: Number(row.amount_paid ?? paiseToRupees(amountPaidPaise)),
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    items,
    payments,
  };
}

export interface InvoiceFilters {
  status?: string;
  search?: string;
  customerId?: string;
  subscriptionId?: string;
}

export async function getInvoices(filters?: InvoiceFilters): Promise<DetailedInvoice[]> {
  const client = await createServerClient();
  if (!client) {
    return [];
  }

  let query = client.from("invoices").select(`
    *,
    profiles:customer_id (full_name, email),
    invoice_items (*),
    payments (*)
  `);

  if (filters?.customerId) {
    query = query.eq("customer_id", filters.customerId);
  }
  if (filters?.subscriptionId) {
    query = query.eq("subscription_id", filters.subscriptionId);
  }
  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  query = query.order("created_at", { ascending: false });

  const { data, error } = await query;
  if (error) {
    if (error.code === "42501") {
      console.warn("Permission denied querying invoices: caller is unauthenticated or lacks table grant.");
      return [];
    }
    throw new Error(`Failed to query invoices from database: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return [];
  }

  let mapped: DetailedInvoice[] = data.map(mapDbInvoice);

  if (filters?.search && filters.search.trim().length > 0) {
    const q = filters.search.toLowerCase().trim();
    mapped = mapped.filter(
      (inv) =>
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.customerName?.toLowerCase().includes(q) ||
        inv.customerEmail?.toLowerCase().includes(q)
    );
  }

  return mapped.map((inv) => {
    const resolvedExtended = resolveInvoiceStatus(inv.extendedStatus, inv.dueDate, inv.amountDuePaise);
    return {
      ...inv,
      extendedStatus: resolvedExtended,
      status: toBaseInvoiceStatus(resolvedExtended),
    };
  });
}

export async function getInvoiceById(id: string): Promise<DetailedInvoice | null> {
  const client = await createServerClient();
  if (!client) {
    return null;
  }

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const query = client
    .from("invoices")
    .select(`
      *,
      profiles:customer_id (full_name, email),
      invoice_items (*),
      payments (*)
    `)
    .eq(isUuid ? "id" : "invoice_number", id)
    .maybeSingle();

  const { data, error } = await query;
  if (error) {
    if (error.code === "42501") {
      return null;
    }
    throw new Error(`Failed to query invoice ${id} from database: ${error.message}`);
  }

  if (!data) return null;

  return mapDbInvoice(data);
}

export interface CreateInvoiceItemInput {
  productId?: string;
  description: string;
  quantity: number;
  unitPricePaise: number;
  taxRatePercent?: number;
  discountCode?: string;
}

export interface CreateInvoiceParams {
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  subscriptionId?: string;
  dueDate: string;
  periodStart?: string;
  periodEnd?: string;
  notes?: string;
  items: CreateInvoiceItemInput[];
  status?: ExtendedInvoiceStatus;
}

export async function generateNextInvoiceNumber(): Promise<string> {
  try {
    const client = await createServerClient();
    if (client) {
      const { data } = await client
        .from("invoices")
        .select("invoice_number")
        .order("created_at", { ascending: false })
        .limit(1);

      if (data && data.length > 0 && data[0].invoice_number) {
        const match = data[0].invoice_number.match(/INV-2026-(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          return `INV-2026-${(num + 1).toString().padStart(4, "0")}`;
        }
      }
    }
  } catch {
    // Fall back to timestamp suffix
  }

  return `INV-2026-${Date.now().toString().slice(-4)}`;
}

export async function validateCustomer(
  customerId: string,
  customerEmail?: string
): Promise<{ customerId: string; customerName: string; customerEmail: string }> {
  // 1. Check database profiles if client is available
  try {
    const client = await createServerClient();
    if (client) {
      if (customerId) {
        const { data } = await client
          .from("profiles")
          .select("id, full_name, email")
          .eq("id", customerId)
          .maybeSingle();
        if (data) {
          return {
            customerId: data.id,
            customerName: data.full_name || data.email,
            customerEmail: data.email,
          };
        }
      }
      if (customerEmail) {
        const { data } = await client
          .from("profiles")
          .select("id, full_name, email")
          .eq("email", customerEmail)
          .maybeSingle();
        if (data) {
          return {
            customerId: data.id,
            customerName: data.full_name || data.email,
            customerEmail: data.email,
          };
        }
      }
    }
  } catch {
    // Continue to check known seed customers
  }

  // 2. Check seed customers dictionary for known seed fixtures
  if (customerId && KNOWN_SEED_CUSTOMERS[customerId]) {
    const c = KNOWN_SEED_CUSTOMERS[customerId];
    return { customerId, customerName: c.name, customerEmail: c.email };
  }

  if (customerEmail) {
    const matched = Object.entries(KNOWN_SEED_CUSTOMERS).find(
      ([, info]) => info.email.toLowerCase() === customerEmail.toLowerCase()
    );
    if (matched) {
      return { customerId: matched[0], customerName: matched[1].name, customerEmail: matched[1].email };
    }
  }

  // Reject invalid customer
  throw new Error(
    `Invalid customer: Customer ${customerId || customerEmail} does not exist in the database or customer directory. Fake customer records are rejected.`
  );
}

export async function createInvoice(params: CreateInvoiceParams): Promise<DetailedInvoice> {
  const client = await createServerClient();
  if (!client) {
    throw new Error("Database client is not available. Please verify Supabase configuration.");
  }

  const invoiceId = crypto.randomUUID();
  const invoiceNumber = await generateNextInvoiceNumber();

  // Validate customer existence - do not accept fake customer UUIDs
  const validCustomer = await validateCustomer(params.customerId, params.customerEmail);
  const customerId = validCustomer.customerId;
  const customerName = params.customerName || validCustomer.customerName;
  const customerEmail = params.customerEmail || validCustomer.customerEmail;

  // Partial unique constraint verification (idempotency for recurring subscriptions)
  if (params.subscriptionId && params.periodStart) {
    const { data: existing } = await client
      .from("invoices")
      .select("id, invoice_number")
      .eq("subscription_id", params.subscriptionId)
      .eq("billing_period_start", params.periodStart)
      .neq("status", "cancelled")
      .maybeSingle();

    if (existing) {
      throw new Error(
        `Invoice already exists for subscription ${params.subscriptionId} for period ${params.periodStart} (${existing.invoice_number}).`
      );
    }
  }

  const calcInputs: LineItemCalculationInput[] = [];
  const processedItems: InvoiceItem[] = [];
  const discountsToIncrement: string[] = [];

  for (const item of params.items) {
    let discountType: "percentage" | "fixed" | undefined;
    let discountValue: number | undefined;

    if (item.discountCode) {
      const discount = await getDiscountByCode(item.discountCode);
      if (discount) {
        const itemSubtotal = item.quantity * item.unitPricePaise;
        const evalResult = evaluateDiscountEligibility(
          discount,
          itemSubtotal,
          item.quantity,
          {
            productId: item.productId,
            subscriptionId: params.subscriptionId,
          }
        );
        if (evalResult.valid) {
          discountType = discount.type;
          discountValue = discount.type === "percentage" ? discount.value : evalResult.discountPaise;
          discountsToIncrement.push(discount.code);
        }
      }
    }

    const input: LineItemCalculationInput = {
      quantity: item.quantity,
      unitPricePaise: item.unitPricePaise,
      discountType,
      discountValue,
      taxRatePercent: item.taxRatePercent ?? 18,
    };
    calcInputs.push(input);
  }

  const totals = calculateInvoiceTotals(calcInputs, 0);

  totals.items.forEach((calc, idx) => {
    const original = params.items[idx];
    processedItems.push({
      id: crypto.randomUUID(),
      invoiceId,
      productId: original.productId,
      description: original.description,
      quantity: calc.quantity,
      unitPricePaise: calc.unitPricePaise,
      subtotalPaise: calc.subtotalPaise,
      discountAmountPaise: calc.discountPaise,
      taxRatePercent: calc.taxRatePercent,
      taxAmountPaise: calc.taxPaise,
      totalAmountPaise: calc.totalPaise,
      createdAt: new Date().toISOString(),
    });
  });

  const extendedStatus: ExtendedInvoiceStatus = params.status || "confirmed";
  const baseStatus = toBaseInvoiceStatus(extendedStatus);

  // Insert into Supabase matching live table columns
  const { error: invErr } = await client.from("invoices").insert({
    id: invoiceId,
    invoice_number: invoiceNumber,
    customer_id: customerId,
    subscription_id: params.subscriptionId || null,
    status: baseStatus,
    currency: "INR",
    due_date: params.dueDate,
    billing_period_start: params.periodStart || null,
    billing_period_end: params.periodEnd || null,
    subtotal: paiseToRupees(totals.subtotalPaise),
    discount_amount: paiseToRupees(totals.discountTotalPaise),
    tax_amount: paiseToRupees(totals.taxTotalPaise),
    amount_paid: 0.0,
    amount_due: paiseToRupees(totals.totalPaise),
  });

  if (invErr) {
    throw new Error(`Failed to create invoice in database: ${invErr.message}`);
  }

  const dbItems = processedItems.map((it) => ({
    id: it.id,
    invoice_id: invoiceId,
    description: it.description,
    quantity: it.quantity,
    unit_price: paiseToRupees(it.unitPricePaise),
    discount_amount: paiseToRupees(it.discountAmountPaise),
    tax_amount: paiseToRupees(it.taxAmountPaise),
    total_amount: paiseToRupees(it.totalAmountPaise),
  }));

  const { error: itemsErr } = await client.from("invoice_items").insert(dbItems);
  if (itemsErr) {
    throw new Error(`Failed to create invoice items in database: ${itemsErr.message}`);
  }

  // Update discount usage count after successful creation
  for (const code of discountsToIncrement) {
    await incrementDiscountUsage(code);
  }

  return {
    id: invoiceId,
    invoiceNumber,
    customerId,
    customerName,
    customerEmail,
    subscriptionId: params.subscriptionId,
    status: baseStatus,
    extendedStatus,
    currency: "INR",
    issueDate: new Date().toISOString(),
    dueDate: params.dueDate,
    periodStart: params.periodStart,
    periodEnd: params.periodEnd,
    subtotalPaise: totals.subtotalPaise,
    discountTotalPaise: totals.discountTotalPaise,
    taxTotalPaise: totals.taxTotalPaise,
    totalAmountPaise: totals.totalPaise,
    amountPaidPaise: 0,
    amountDuePaise: totals.totalPaise,
    amountDue: paiseToRupees(totals.totalPaise),
    amountPaid: 0,
    notes: params.notes,
    createdAt: new Date().toISOString(),
    items: processedItems,
    payments: [],
  };
}

export async function updateInvoiceStatus(
  id: string,
  status: ExtendedInvoiceStatus
): Promise<DetailedInvoice> {
  const inv = await getInvoiceById(id);
  if (!inv) {
    throw new Error(`Invoice ${id} not found.`);
  }

  if (inv.extendedStatus === "paid" && status !== "paid") {
    throw new Error("Cannot change status of an already paid invoice.");
  }
  if (inv.extendedStatus === "cancelled") {
    throw new Error("Cannot reopen a cancelled invoice.");
  }

  const client = await createServerClient();
  if (!client) {
    throw new Error("Database client is not available.");
  }

  const baseStatus = toBaseInvoiceStatus(status);
  const { error } = await client
    .from("invoices")
    .update({
      status: baseStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", inv.id);

  if (error) {
    throw new Error(`Failed to update invoice status in database: ${error.message}`);
  }

  return {
    ...inv,
    extendedStatus: status,
    status: baseStatus,
  };
}

export async function applyPaymentToInvoice(
  invoiceId: string,
  paymentPaise: number,
  paymentRecord?: any
): Promise<DetailedInvoice> {
  const inv = await getInvoiceById(invoiceId);
  if (!inv) {
    throw new Error(`Invoice with id ${invoiceId} not found.`);
  }

  if (paymentPaise > inv.amountDuePaise) {
    throw new Error(
      `Overpayment rejected: payment of ₹${paiseToRupees(paymentPaise).toFixed(
        2
      )} exceeds amount due of ₹${paiseToRupees(inv.amountDuePaise).toFixed(2)}.`
    );
  }

  const client = await createServerClient();
  if (!client) {
    throw new Error("Database client is not available.");
  }

  const newPaidPaise = inv.amountPaidPaise + paymentPaise;
  const newDuePaise = Math.max(0, inv.totalAmountPaise - newPaidPaise);
  const newPaidRupees = paiseToRupees(newPaidPaise);
  const newDueRupees = paiseToRupees(newDuePaise);
  const newStatus = newDuePaise === 0 ? "paid" : inv.status;
  const newExtended = newDuePaise === 0 ? "paid" : inv.extendedStatus;

  const { error } = await client
    .from("invoices")
    .update({
      amount_paid: newPaidRupees,
      amount_due: newDueRupees,
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", inv.id);

  if (error) {
    throw new Error(`Failed to update invoice payment amounts in database: ${error.message}`);
  }

  const updatedPayments = paymentRecord
    ? [paymentRecord, ...(inv.payments || [])]
    : inv.payments;

  return {
    ...inv,
    amountPaidPaise: newPaidPaise,
    amountDuePaise: newDuePaise,
    amountPaid: newPaidRupees,
    amountDue: newDueRupees,
    status: newStatus,
    extendedStatus: newExtended,
    payments: updatedPayments,
  };
}

export async function getBillingAnalyticsSummary(): Promise<BillingAnalyticsSummary> {
  const allInvoices = await getInvoices();

  let totalRevenuePaise = 0;
  let totalCollectedPaise = 0;
  let totalOutstandingPaise = 0;
  let overdueInvoicesCount = 0;
  let paidInvoicesCount = 0;
  let openInvoicesCount = 0;
  let draftInvoicesCount = 0;
  let cancelledInvoicesCount = 0;

  for (const inv of allInvoices) {
    if (inv.extendedStatus !== "cancelled") {
      totalRevenuePaise += inv.totalAmountPaise;
      totalCollectedPaise += inv.amountPaidPaise;
      totalOutstandingPaise += inv.amountDuePaise;
    }

    switch (inv.extendedStatus) {
      case "paid":
        paidInvoicesCount++;
        break;
      case "overdue":
        overdueInvoicesCount++;
        break;
      case "confirmed":
        openInvoicesCount++;
        break;
      case "draft":
        draftInvoicesCount++;
        break;
      case "cancelled":
        cancelledInvoicesCount++;
        break;
    }
  }

  const collectionRatePercent =
    totalRevenuePaise > 0
      ? Number(((totalCollectedPaise / totalRevenuePaise) * 100).toFixed(1))
      : 0;

  let recentPayments: any[] = [];
  try {
    const { getPayments } = await import("./payments");
    const paymentsList = await getPayments();
    recentPayments = paymentsList.slice(0, 10);
  } catch {
    recentPayments = [];
  }

  return {
    totalRevenuePaise,
    totalCollectedPaise,
    totalOutstandingPaise,
    overdueInvoicesCount,
    paidInvoicesCount,
    openInvoicesCount,
    draftInvoicesCount,
    cancelledInvoicesCount,
    collectionRatePercent,
    recentPayments,
  };
}
