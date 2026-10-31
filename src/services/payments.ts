import { DetailedPayment, PaymentMethodType } from "@/types";
import { rupeesToPaise, paiseToRupees, formatINR } from "@/lib/billing/math";
import { RecordPaymentInput } from "@/lib/validations/billing";
import { getInvoiceById, applyPaymentToInvoice } from "./invoices";
import { createServerClient } from "@/lib/supabase/server";

// 12 Deterministic seed payments matching the seed data
let paymentsStore: DetailedPayment[] = [
  {
    id: "44444444-4444-4000-8000-000000000001",
    invoiceId: "33333333-3333-4000-8000-000000000001",
    customerId: "a0000000-0000-4000-8000-000000000001",
    amount: 5898.82,
    amountPaise: 589882,
    currency: "INR",
    status: "succeeded",
    paymentMethod: "card",
    paymentMethodType: "card",
    paymentDate: "2026-10-02T14:30:00Z",
    transactionReference: "TXN_CARD_981245",
    notes: "Full settlement via Visa card ending in 4242",
    createdAt: "2026-10-02T14:30:00Z",
  },
  {
    id: "44444444-4444-4000-8000-000000000002",
    invoiceId: "33333333-3333-4000-8000-000000000002",
    customerId: "a0000000-0000-4000-8000-000000000002",
    amount: 2831.06,
    amountPaise: 283106,
    currency: "INR",
    status: "succeeded",
    paymentMethod: "upi",
    paymentMethodType: "upi",
    paymentDate: "2026-10-02T10:15:00Z",
    transactionReference: "UPI_RR_8823412",
    notes: "UPI payment via Google Pay",
    createdAt: "2026-10-02T10:15:00Z",
  },
  {
    id: "44444444-4444-4000-8000-000000000003",
    invoiceId: "33333333-3333-4000-8000-000000000003",
    customerId: "a0000000-0000-4000-8000-000000000003",
    amount: 25074.0,
    amountPaise: 2507400,
    currency: "INR",
    status: "succeeded",
    paymentMethod: "bank_transfer",
    paymentMethodType: "bank_transfer",
    paymentDate: "2026-09-16T11:00:00Z",
    transactionReference: "NEFT_HDFC_009912",
    notes: "Corporate NEFT transfer verified",
    createdAt: "2026-09-16T11:00:00Z",
  },
  {
    id: "44444444-4444-4000-8000-000000000004",
    invoiceId: "33333333-3333-4000-8000-000000000004",
    customerId: "a0000000-0000-4000-8000-000000000004",
    amount: 5000.0,
    amountPaise: 500000,
    currency: "INR",
    status: "succeeded",
    paymentMethod: "upi",
    paymentMethodType: "upi",
    paymentDate: "2026-10-21T09:45:00Z",
    transactionReference: "UPI_RR_991204",
    notes: "First installment partial payment",
    createdAt: "2026-10-21T09:45:00Z",
  },
  {
    id: "44444444-4444-4000-8000-000000000005",
    invoiceId: "33333333-3333-4000-8000-000000000005",
    customerId: "a0000000-0000-4000-8000-000000000005",
    amount: 4440.0,
    amountPaise: 444000,
    currency: "INR",
    status: "succeeded",
    paymentMethod: "net_banking",
    paymentMethodType: "net_banking",
    paymentDate: "2026-10-26T16:20:00Z",
    transactionReference: "NETB_ICICI_77812",
    notes: "Initial tranche recorded by finance staff",
    createdAt: "2026-10-26T16:20:00Z",
  },
  {
    id: "44444444-4444-4000-8000-000000000006",
    invoiceId: "33333333-3333-4000-8000-000000000007",
    customerId: "a0000000-0000-4000-8000-000000000007",
    amount: 7700.0,
    amountPaise: 770000,
    currency: "INR",
    status: "succeeded",
    paymentMethod: "manual",
    paymentMethodType: "manual",
    paymentDate: "2026-09-12T12:00:00Z",
    transactionReference: "MANUAL_RECEIPT_104",
    notes: "Cheque deposit acknowledged by finance team",
    createdAt: "2026-09-12T12:00:00Z",
  },
  {
    id: "44444444-4444-4000-8000-000000000007",
    invoiceId: "33333333-3333-4000-8000-000000000010",
    customerId: "a0000000-0000-4000-8000-000000000010",
    amount: 2358.82,
    amountPaise: 235882,
    currency: "INR",
    status: "succeeded",
    paymentMethod: "card",
    paymentMethodType: "card",
    paymentDate: "2026-10-12T18:00:00Z",
    transactionReference: "TXN_CARD_102938",
    notes: "Mastercard transaction auth verified",
    createdAt: "2026-10-12T18:00:00Z",
  },
  {
    id: "44444444-4444-4000-8000-000000000008",
    invoiceId: "33333333-3333-4000-8000-000000000011",
    customerId: "a0000000-0000-4000-8000-000000000001",
    amount: 5898.82,
    amountPaise: 589882,
    currency: "INR",
    status: "succeeded",
    paymentMethod: "card",
    paymentMethodType: "card",
    paymentDate: "2026-09-02T14:10:00Z",
    transactionReference: "TXN_CARD_882910",
    notes: "Recurring billing card charge",
    createdAt: "2026-09-02T14:10:00Z",
  },
  {
    id: "44444444-4444-4000-8000-000000000009",
    invoiceId: "33333333-3333-4000-8000-000000000013",
    customerId: "a0000000-0000-4000-8000-000000000003",
    amount: 10618.94,
    amountPaise: 1061894,
    currency: "INR",
    status: "succeeded",
    paymentMethod: "bank_transfer",
    paymentMethodType: "bank_transfer",
    paymentDate: "2026-10-19T13:45:00Z",
    transactionReference: "RTGS_KOTAK_5510",
    notes: "RTGS settlement verified in corporate account",
    createdAt: "2026-10-19T13:45:00Z",
  },
  {
    id: "44444444-4444-4000-8000-000000000010",
    invoiceId: "33333333-3333-4000-8000-000000000015",
    customerId: "a0000000-0000-4000-8000-000000000005",
    amount: 1770.0,
    amountPaise: 177000,
    currency: "INR",
    status: "succeeded",
    paymentMethod: "upi",
    paymentMethodType: "upi",
    paymentDate: "2026-10-10T11:25:00Z",
    transactionReference: "UPI_BHIM_441029",
    notes: "BHIM UPI payment received",
    createdAt: "2026-10-10T11:25:00Z",
  },
  {
    id: "44444444-4444-4000-8000-000000000011",
    invoiceId: "33333333-3333-4000-8000-000000000017",
    customerId: "a0000000-0000-4000-8000-000000000007",
    amount: 4720.0,
    amountPaise: 472000,
    currency: "INR",
    status: "succeeded",
    paymentMethod: "net_banking",
    paymentMethodType: "net_banking",
    paymentDate: "2026-10-16T15:30:00Z",
    transactionReference: "NETB_AXIS_99182",
    notes: "Axis Bank Net Banking confirmation",
    createdAt: "2026-10-16T15:30:00Z",
  },
  {
    id: "44444444-4444-4000-8000-000000000012",
    invoiceId: "33333333-3333-4000-8000-000000000019",
    customerId: "a0000000-0000-4000-8000-000000000009",
    amount: 4718.82,
    amountPaise: 471882,
    currency: "INR",
    status: "succeeded",
    paymentMethod: "card",
    paymentMethodType: "card",
    paymentDate: "2026-10-22T08:00:00Z",
    transactionReference: "TXN_CARD_771920",
    notes: "Visa auto-debit confirmation",
    createdAt: "2026-10-22T08:00:00Z",
  },
];

function mapDbPayment(row: any): DetailedPayment {
  return {
    id: row.id,
    invoiceId: row.invoice_id,
    customerId: row.customer_id,
    amount: Number(row.amount),
    amountPaise: rupeesToPaise(Number(row.amount)),
    currency: row.currency || "INR",
    status: row.status,
    paymentMethod: row.payment_method,
    paymentMethodType: row.payment_method as PaymentMethodType,
    paymentDate: row.payment_date,
    transactionReference: row.transaction_reference || undefined,
    notes: row.notes || undefined,
    createdAt: row.created_at,
  };
}

export interface PaymentFilters {
  invoiceId?: string;
  customerId?: string;
  paymentMethod?: string;
  status?: string;
}

export async function getPayments(filters?: PaymentFilters): Promise<DetailedPayment[]> {
  const supabase = createServerClient();
  if (supabase) {
    try {
      let query = supabase.from("payments").select("*").order("payment_date", { ascending: false });

      if (filters?.invoiceId) {
        query = query.eq("invoice_id", filters.invoiceId);
      }
      if (filters?.customerId) {
        query = query.eq("customer_id", filters.customerId);
      }
      if (filters?.paymentMethod && filters.paymentMethod !== "all") {
        query = query.eq("payment_method", filters.paymentMethod);
      }
      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data.map(mapDbPayment);
      }
    } catch {
      // Fallback
    }
  }

  let results = [...paymentsStore];

  if (filters?.invoiceId) {
    results = results.filter((p) => p.invoiceId === filters.invoiceId);
  }

  if (filters?.customerId) {
    results = results.filter((p) => p.customerId === filters.customerId);
  }

  if (filters?.paymentMethod && filters.paymentMethod !== "all") {
    results = results.filter((p) => p.paymentMethod === filters.paymentMethod);
  }

  if (filters?.status && filters.status !== "all") {
    results = results.filter((p) => p.status === filters.status);
  }

  return results.sort(
    (a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
  );
}

export async function recordPayment(input: RecordPaymentInput): Promise<{
  payment: DetailedPayment;
  updatedInvoice: any;
}> {
  const invoice = await getInvoiceById(input.invoiceId);
  if (!invoice) {
    throw new Error(`Invoice with ID ${input.invoiceId} does not exist.`);
  }

  if (invoice.extendedStatus === "cancelled") {
    throw new Error("Cannot record payment against a cancelled invoice.");
  }

  if (invoice.extendedStatus === "draft") {
    throw new Error("Cannot record payment against an unconfirmed draft invoice.");
  }

  const paymentPaise = rupeesToPaise(input.amountRupees);
  if (paymentPaise <= 0) {
    throw new Error("Payment amount must be greater than zero.");
  }

  if (paymentPaise > invoice.amountDuePaise) {
    throw new Error(
      `Overpayment rejected! Payment of ${formatINR(paymentPaise)} exceeds outstanding balance of ${formatINR(
        invoice.amountDuePaise
      )}.`
    );
  }

  const newPaymentId = crypto.randomUUID();
  const txRef =
    input.transactionReference ||
    `TXN_${input.paymentMethod.toUpperCase()}_${Math.floor(100000 + Math.random() * 900000)}`;

  const newPayment: DetailedPayment = {
    id: newPaymentId,
    invoiceId: invoice.id,
    customerId: input.customerId || invoice.customerId,
    amount: input.amountRupees,
    amountPaise: paymentPaise,
    currency: "INR",
    status: "succeeded",
    paymentMethod: input.paymentMethod,
    paymentMethodType: input.paymentMethod as PaymentMethodType,
    paymentDate: new Date().toISOString(),
    transactionReference: txRef,
    notes: input.notes,
    createdAt: new Date().toISOString(),
  };

  const supabase = createServerClient();
  let rpcSucceeded = false;

  if (supabase) {
    try {
      // 1. Attempt database RPC for atomic row-locking execution
      const { data: rpcData, error: rpcError } = await supabase.rpc("record_invoice_payment", {
        p_invoice_id: invoice.id,
        p_customer_id: input.customerId || invoice.customerId,
        p_amount: input.amountRupees,
        p_payment_method: input.paymentMethod,
        p_transaction_reference: txRef,
        p_notes: input.notes || null,
      });

      if (!rpcError && rpcData) {
        rpcSucceeded = true;
      } else {
        // Fallback: direct table operations if RPC not yet deployed
        await supabase.from("payments").insert({
          id: newPaymentId,
          invoice_id: invoice.id,
          customer_id: input.customerId || invoice.customerId,
          amount: input.amountRupees,
          currency: "INR",
          payment_method: input.paymentMethod,
          status: "succeeded",
          payment_date: new Date().toISOString(),
          transaction_reference: txRef,
          notes: input.notes,
        });

        const newPaidPaise = invoice.amountPaidPaise + paymentPaise;
        const newDuePaise = Math.max(0, invoice.totalAmountPaise - newPaidPaise);
        const newStatus = newDuePaise === 0 ? "paid" : invoice.status;

        await supabase
          .from("invoices")
          .update({
            amount_paid: paiseToRupees(newPaidPaise),
            amount_due: paiseToRupees(newDuePaise),
            status: newStatus,
            updated_at: new Date().toISOString(),
          })
          .eq("id", invoice.id);
      }
    } catch {
      // Supabase write fallback
    }
  }

  // Atomically update invoice in memory store
  const updatedInvoice = await applyPaymentToInvoice(invoice.id, paymentPaise, newPayment);
  paymentsStore.unshift(newPayment);

  return {
    payment: { ...newPayment },
    updatedInvoice,
  };
}
