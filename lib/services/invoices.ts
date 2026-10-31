import { Invoice, InvoiceStatus, PaginatedResult } from "@/types";
import { getMockDb, saveMockDb } from "@/lib/mock/db";
import { requireRole } from "./users";
import { UserRole } from "@/lib/auth";

export const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA !== "false";

export async function listInvoices(options?: {
  customerId?: string;
  status?: string;
  overdueOnly?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResult<Invoice>> {
  const page = options?.page || 1;
  const pageSize = options?.pageSize || 25;

  if (USE_MOCK_DATA) {
    const db = getMockDb();
    let invoices = db.store.invoices || [];

    if (options?.customerId && options.customerId !== "all") {
      invoices = invoices.filter((i) => i.customerId === options.customerId);
    }
    if (options?.status && options.status !== "all") {
      invoices = invoices.filter((i) => i.status === options.status);
    }
    if (options?.overdueOnly) {
      invoices = invoices.filter((i) => i.status === "overdue" || (i.balance > 0 && i.daysOverdue > 0));
    }
    if (options?.search) {
      const q = options.search.toLowerCase();
      invoices = invoices.filter(
        (i) =>
          i.invoiceNo.toLowerCase().includes(q) ||
          i.customer?.name.toLowerCase().includes(q) ||
          i.customer?.company.toLowerCase().includes(q)
      );
    }

    const total = invoices.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const data = invoices.slice(start, start + pageSize);

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

export async function getInvoiceById(
  id: string,
  requesterCustomerId?: string
): Promise<Invoice | null> {
  if (USE_MOCK_DATA) {
    const db = getMockDb();
    const invoice = db.store.invoices?.find((i) => i.id === id) || null;
    if (!invoice) return null;

    // Cross-customer security contract: Block access if requester is another customer
    if (requesterCustomerId && invoice.customerId !== requesterCustomerId) {
      return null;
    }
    return invoice;
  }

  // TODO: Supabase implementation
  return null;
}

export async function confirmInvoice(
  id: string,
  actor: { name: string; role: UserRole } = { name: "Staff Member", role: "staff" }
): Promise<Invoice> {
  requireRole(actor.role, ["admin", "staff"]);

  if (USE_MOCK_DATA) {
    const db = getMockDb();
    const inv = db.store.invoices.find((i) => i.id === id);
    if (!inv) throw new Error(`Invoice not found: ${id}`);

    if (inv.status !== "draft") {
      throw new Error(`Invoice ${inv.invoiceNo} is already ${inv.status}. Only Draft invoices can be confirmed.`);
    }

    inv.status = "confirmed";
    saveMockDb(db);
    return inv;
  }

  // TODO: Supabase implementation
  throw new Error("Supabase not configured");
}

export async function cancelInvoice(
  id: string,
  actor: { name: string; role: UserRole } = { name: "Staff Member", role: "staff" }
): Promise<Invoice> {
  requireRole(actor.role, ["admin", "staff"]);

  if (USE_MOCK_DATA) {
    const db = getMockDb();
    const inv = db.store.invoices.find((i) => i.id === id);
    if (!inv) throw new Error(`Invoice not found: ${id}`);

    if (inv.status === "paid") {
      throw new Error(`Cannot cancel invoice ${inv.invoiceNo} because it has already been paid.`);
    }

    inv.status = "cancelled";
    saveMockDb(db);
    return inv;
  }

  // TODO: Supabase implementation
  throw new Error("Supabase not configured");
}

/**
 * Sends invoice to customer: creates mock email in Dev Mailbox
 */
export async function sendInvoiceEmail(
  id: string,
  actor: { name: string; role: UserRole } = { name: "Staff Member", role: "staff" }
): Promise<{ success: boolean; emailTo: string }> {
  requireRole(actor.role, ["admin", "staff"]);

  if (USE_MOCK_DATA) {
    const db = getMockDb();
    const inv = db.store.invoices.find((i) => i.id === id);
    if (!inv) throw new Error(`Invoice not found: ${id}`);

    const recipient = inv.customer?.email || "customer@example.com";
    const mailId = `mail-${Date.now().toString(36)}`;

    db.emails.unshift({
      id: mailId,
      to: recipient,
      subject: `Invoice Available: ${inv.invoiceNo} (₹${inv.totalAmount.toLocaleString("en-IN")})`,
      body: `Dear ${inv.customer?.name || "Customer"},\n\nYour invoice ${inv.invoiceNo} for ₹${inv.totalAmount.toLocaleString(
        "en-IN"
      )} is now available for review and payment.\nDue date: ${inv.dueDate}.\n\nYou can access your portal here:\n/portal/invoices/${inv.id}`,
      createdAt: new Date().toISOString(),
    });

    saveMockDb(db);
    return { success: true, emailTo: recipient };
  }

  // TODO: Supabase implementation
  throw new Error("Supabase not configured");
}

/**
 * Dispatches an overdue reminder to the Dev Mailbox
 */
export async function sendOverdueReminder(
  id: string,
  actor: { name: string; role: UserRole } = { name: "Staff Member", role: "staff" }
): Promise<{ success: boolean; emailTo: string }> {
  requireRole(actor.role, ["admin", "staff"]);

  if (USE_MOCK_DATA) {
    const db = getMockDb();
    const inv = db.store.invoices.find((i) => i.id === id);
    if (!inv) throw new Error(`Invoice not found: ${id}`);

    const recipient = inv.customer?.email || "customer@example.com";
    const mailId = `mail-${Date.now().toString(36)}`;

    db.emails.unshift({
      id: mailId,
      to: recipient,
      subject: `[REMINDER] Overdue Payment: Invoice ${inv.invoiceNo} (₹${inv.balance.toLocaleString("en-IN")})`,
      body: `Dear ${inv.customer?.name || "Customer"},\n\nThis is a reminder that invoice ${inv.invoiceNo} is past due (Due date: ${inv.dueDate}, ${inv.daysOverdue} days overdue).\nOutstanding balance: ₹${inv.balance.toLocaleString("en-IN")}.\n\nPlease settle this invoice at your earliest convenience:\n/portal/invoices/${inv.id}`,
      createdAt: new Date().toISOString(),
    });

    saveMockDb(db);
    return { success: true, emailTo: recipient };
  }

  // TODO: Supabase implementation
  throw new Error("Supabase not configured");
}
