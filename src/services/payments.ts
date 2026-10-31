import { DetailedPayment, PaymentMethodType } from "@/types";
import { rupeesToPaise, paiseToRupees, formatINR } from "@/lib/billing/math";
import { RecordPaymentInput, ProcessDemoPaymentInput } from "@/lib/validations/billing";
import { getInvoiceById } from "./invoices";
import { createServerClient } from "@/lib/supabase/server";

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
  const supabase = await createServerClient();
  if (!supabase) {
    return [];
  }

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
  if (error) {
    throw new Error(`Failed to query payments from database: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return [];
  }

  return data.map(mapDbPayment);
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
    `TXN_${input.paymentMethod.toUpperCase()}_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

  const supabase = await createServerClient();
  if (!supabase) {
    throw new Error("Database client is not available. Cannot persist payment.");
  }

  let paymentRecordId = newPaymentId;

  // 1. Attempt database RPC for atomic row-locking execution
  const { data: rpcData, error: rpcError } = await supabase.rpc("record_invoice_payment", {
    p_invoice_id: invoice.id,
    p_customer_id: input.customerId || invoice.customerId,
    p_amount: input.amountRupees,
    p_payment_method: input.paymentMethod,
    p_transaction_reference: txRef,
    p_notes: input.notes || null,
  });

  if (rpcError) {
    // If RPC is missing or fails, execute direct table writes
    const { error: insertErr } = await supabase.from("payments").insert({
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

    if (insertErr) {
      throw new Error(`Failed to record payment in database: ${insertErr.message}`);
    }

    const newPaidPaise = invoice.amountPaidPaise + paymentPaise;
    const newDuePaise = Math.max(0, invoice.totalAmountPaise - newPaidPaise);
    const newStatus = newDuePaise === 0 ? "paid" : invoice.status;

    const { error: updateErr } = await supabase
      .from("invoices")
      .update({
        amount_paid: paiseToRupees(newPaidPaise),
        amount_due: paiseToRupees(newDuePaise),
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", invoice.id);

    if (updateErr) {
      throw new Error(`Failed to update invoice balance in database: ${updateErr.message}`);
    }
  } else if (rpcData && rpcData.payment_id) {
    paymentRecordId = rpcData.payment_id;
  }

  // Reload the updated invoice directly from the database
  const updatedInvoice = await getInvoiceById(invoice.id);

  const newPayment: DetailedPayment = {
    id: paymentRecordId,
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

  return {
    payment: newPayment,
    updatedInvoice: updatedInvoice || invoice,
  };
}

export interface ProcessDemoPaymentResult {
  success: boolean;
  payment?: DetailedPayment;
  updatedInvoice?: any;
  transactionReference: string;
  error?: string;
  errorCode?: string;
  message?: string;
}

/**
 * Functional DEMO Payment Gateway Processor
 * Performs strict server-side validation of invoice ownership, status,
 * balance, and handles simulated success or simulated failure outcomes.
 *
 * Production Guard: Disabled in production unless explicitly overridden
 * via ENABLE_DEMO_PAYMENT_GATEWAY="true".
 */
export async function processDemoPayment(
  input: ProcessDemoPaymentInput
): Promise<ProcessDemoPaymentResult> {
  // Production environment guard
  const isProduction =
    process.env.NODE_ENV === "production" &&
    process.env.ENABLE_DEMO_PAYMENT_GATEWAY !== "true";

  if (isProduction) {
    throw new Error(
      "Demo payment gateway is disabled in production environments. Set ENABLE_DEMO_PAYMENT_GATEWAY=true to enable."
    );
  }

  // 1. Verify invoice existence
  const invoice = await getInvoiceById(input.invoiceId);
  if (!invoice) {
    throw new Error(`Invoice with ID ${input.invoiceId} does not exist.`);
  }

  // 2. Verify invoice status
  if (invoice.extendedStatus === "cancelled") {
    throw new Error("Cannot process demo payment against a cancelled invoice.");
  }
  if (invoice.extendedStatus === "draft") {
    throw new Error("Cannot process demo payment against an unconfirmed draft invoice.");
  }
  if (invoice.amountDuePaise <= 0 || invoice.extendedStatus === "paid") {
    throw new Error("This invoice is already fully settled. No balance remaining.");
  }

  // 3. Verify customer ownership
  if (input.customerId && invoice.customerId !== input.customerId) {
    throw new Error("Unauthorized: Customer ID mismatch for this invoice.");
  }

  // 4. Verify payment amount
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

  // 5. Handle Simulated FAILURE outcome
  if (input.demoOutcome === "failure") {
    const failureTxRef = `DEMO-FAIL-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const reason =
      input.failureReason ||
      "Simulated Bank Decline: Transaction was declined by the simulated card issuer / UPI network.";

    return {
      success: false,
      transactionReference: failureTxRef,
      error: reason,
      errorCode: "SIMULATED_GATEWAY_DECLINE",
      message: "The simulated demo transaction failed as requested. Invoice balance was not changed.",
    };
  }

  // 6. Handle Simulated SUCCESS outcome
  const demoTxRef = `DEMO-PAY-${Date.now()}-${Math.floor(100000 + Math.random() * 900000)}`;

  let methodDetailNote = "";
  if (input.simulatedDetails?.cardLast4) {
    methodDetailNote = ` (${input.simulatedDetails.cardBrand || "Card"} •••• ${input.simulatedDetails.cardLast4})`;
  } else if (input.simulatedDetails?.upiVpa) {
    methodDetailNote = ` (UPI VPA: ${input.simulatedDetails.upiVpa})`;
  } else if (input.simulatedDetails?.bankName) {
    methodDetailNote = ` (Bank: ${input.simulatedDetails.bankName})`;
  }

  const demoNote = `[DEMO PAYMENT GATEWAY] Simulated ${input.paymentMethod.replace("_", " ")}${methodDetailNote}. Test environment only.`;

  // Map debit_card to card in database payment method constraint
  const dbMethod: PaymentMethodType = input.paymentMethod === "debit_card" ? "card" : input.paymentMethod;

  const recordResult = await recordPayment({
    invoiceId: invoice.id,
    customerId: invoice.customerId,
    amountRupees: input.amountRupees,
    paymentMethod: dbMethod,
    transactionReference: demoTxRef,
    notes: demoNote,
  });

  return {
    success: true,
    payment: recordResult.payment,
    updatedInvoice: recordResult.updatedInvoice,
    transactionReference: demoTxRef,
    message: "Demo payment simulated successfully and recorded in database.",
  };
}
