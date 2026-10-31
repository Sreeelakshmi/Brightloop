import { Payment, PaymentMethod, PaginatedResult } from "@/types";
import { getMockDb, saveMockDb } from "@/lib/mock/db";
import { requireRole } from "./users";
import { UserRole } from "@/lib/auth";

export const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA !== "false";

export async function listPayments(options?: {
  customerId?: string;
  invoiceId?: string;
  method?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResult<Payment>> {
  const page = options?.page || 1;
  const pageSize = options?.pageSize || 25;

  if (USE_MOCK_DATA) {
    const db = getMockDb();
    let payments = db.store.payments || [];

    if (options?.customerId && options.customerId !== "all") {
      payments = payments.filter((p) => p.customerId === options.customerId);
    }
    if (options?.invoiceId) {
      payments = payments.filter((p) => p.invoiceId === options.invoiceId);
    }
    if (options?.method && options.method !== "all") {
      payments = payments.filter((p) => p.method === options.method);
    }
    if (options?.search) {
      const q = options.search.toLowerCase();
      payments = payments.filter(
        (p) =>
          p.paymentNo.toLowerCase().includes(q) ||
          p.invoiceNo?.toLowerCase().includes(q) ||
          p.customer?.name.toLowerCase().includes(q) ||
          p.reference.toLowerCase().includes(q)
      );
    }

    const total = payments.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const data = payments.slice(start, start + pageSize);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  // TODO: Supabase implementation
  return { data: [], total: 0, page: 1, pageSize, totalPages: 0 };
}

export async function recordPayment(
  input: {
    invoiceId: string;
    amount: number;
    method: PaymentMethod;
    paymentDate?: string;
    reference?: string;
    note?: string;
  },
  actor: { name: string; role: UserRole } = { name: "Staff Member", role: "staff" }
): Promise<Payment> {
  requireRole(actor.role, ["admin", "staff"]);

  const payAmount = Number(input.amount);
  if (isNaN(payAmount) || payAmount <= 0) {
    throw new Error("Payment amount must be greater than zero.");
  }

  if (USE_MOCK_DATA) {
    const db = getMockDb();
    const inv = db.store.invoices.find((i) => i.id === input.invoiceId);
    if (!inv) throw new Error(`Invoice not found: ${input.invoiceId}`);

    if (inv.status === "cancelled") {
      throw new Error(`Cannot record payment on cancelled invoice ${inv.invoiceNo}.`);
    }

    // Overpayment prevention rule
    if (payAmount > inv.balance) {
      throw new Error(
        `Payment amount (₹${payAmount.toLocaleString("en-IN")}) exceeds invoice balance (₹${inv.balance.toLocaleString(
          "en-IN"
        )}). Overpayment is prohibited.`
      );
    }

    const payId = `pay-${Date.now().toString(36)}`;
    const payNumber = `PAY-${String(db.store.payments.length + 5001)}`;
    const payDate = input.paymentDate || new Date().toISOString();

    const payment: Payment = {
      id: payId,
      paymentNo: payNumber,
      invoiceId: inv.id,
      invoiceNo: inv.invoiceNo,
      customerId: inv.customerId,
      customer: inv.customer,
      amount: payAmount,
      currency: "INR",
      method: input.method,
      status: "succeeded",
      reference: input.reference || `REF-${Date.now().toString(36).toUpperCase()}`,
      note: input.note || "",
      paymentDate: payDate,
      createdAt: new Date().toISOString(),
    };

    // Update invoice financial state
    inv.paidAmount = (inv.paidAmount || 0) + payAmount;
    inv.balance = Math.max(0, inv.balance - payAmount);

    if (inv.balance === 0) {
      inv.status = "paid";
    }

    db.store.payments.unshift(payment);
    saveMockDb(db);
    return payment;
  }

  // TODO: Supabase implementation
  throw new Error("Supabase not configured");
}
