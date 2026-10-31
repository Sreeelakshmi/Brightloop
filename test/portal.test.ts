import { describe, it, expect, beforeEach } from "vitest";
import {
  getMySubscriptions,
  getMySubscription,
  getMyInvoices,
  getMyInvoice,
  getMyPayments,
} from "@/lib/data/portal";
import { getMockStore } from "@/lib/data/mock-generator";

describe("Customer Portal Data Access Layer", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_USE_MOCK_DATA = "true";
  });

  it("retrieves scoped customer subscriptions", async () => {
    const store = getMockStore();
    const custId = store.customers[0].id;

    const subs = await getMySubscriptions(custId);
    expect(subs.length).toBeGreaterThan(0);
    subs.forEach((s) => {
      expect(s.customerId).toBe(custId);
    });
  });

  it("retrieves a single subscription by ID", async () => {
    const store = getMockStore();
    const sub = store.subscriptions[0];

    const result = await getMySubscription(sub.id, sub.customerId);
    expect(result).not.toBeNull();
    expect(result?.id).toBe(sub.id);
  });

  it("retrieves customer scoped paginated invoices", async () => {
    const store = getMockStore();
    const custId = store.customers[0].id;

    const invoices = await getMyInvoices(custId, 1, 5);
    expect(invoices.data.length).toBeGreaterThan(0);
    expect(invoices.page).toBe(1);
    expect(invoices.pageSize).toBe(5);
  });

  it("retrieves a single invoice by ID", async () => {
    const store = getMockStore();
    const inv = store.invoices[0];

    const result = await getMyInvoice(inv.id, inv.customerId);
    expect(result).not.toBeNull();
    expect(result?.invoiceNo).toBe("INV-2901");
  });

  it("retrieves customer payment history", async () => {
    const store = getMockStore();
    const custId = store.customers[0].id;

    const payments = await getMyPayments(custId);
    expect(payments.length).toBeGreaterThan(0);
  });
});

