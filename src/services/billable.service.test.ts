import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getBillableSubscriptions,
  mapBillableSubscriptionRow,
  type BillableSubscriptionRow,
} from "./billable.service";
import * as authModule from "@/lib/auth/require-user";
import * as clientModule from "@/services/supabase-client";

vi.mock("@/lib/auth/require-user", () => ({
  requireUser: vi.fn(),
  getCurrentUser: vi.fn(),
}));

vi.mock("@/services/supabase-client", () => ({
  getSupabaseClient: vi.fn(),
}));

describe("Billable Subscriptions Service", () => {
  const mockQueryBuilder = {
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
  };

  const mockSupabase = {
    from: vi.fn().mockReturnValue(mockQueryBuilder),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(clientModule.getSupabaseClient).mockReturnValue(mockSupabase as any);
  });

  describe("mapBillableSubscriptionRow", () => {
    it("maps snake_case view row and JSONB lines to camelCase BillableSubscription domain model", () => {
      const rawRow: BillableSubscriptionRow = {
        subscription_id: "55555555-5555-5555-0000-000000000001",
        number: "SUB-000001",
        customer_id: "11111111-1111-1111-1111-000000000001",
        customer_name: "Acme Technologies",
        customer_email: "customer01@example.test",
        plan_id: "33333333-3333-3333-3333-000000000003",
        plan_name: "Monthly Enterprise Plan",
        billing_period: "monthly",
        payment_terms: "net_30",
        start_date: "2026-09-30",
        expiry_date: "2027-09-30",
        next_billing_date: "2026-10-31",
        status: "active",
        period_start: "2026-10-31",
        period_end: "2026-11-29",
        subtotal: "3300.00",
        tax_total: "0.00",
        total_amount: "3300.00",
        lines: [
          {
            line_id: "66666666-6666-6666-0000-000000000001",
            product_id: "22222222-2222-2222-2222-000000000001",
            product_name: "Brightloop CRM",
            variant_id: "22222222-2222-2222-2222-000000000101",
            quantity: 1,
            unit_price: "2500.00",
            tax_id: null,
            amount: "2500.00",
          },
          {
            line_id: "77777777-7777-7777-0000-000000000001",
            product_id: "22222222-2222-2222-2222-000000000003",
            product_name: "Priority Support Add-on",
            variant_id: null,
            quantity: 2,
            unit_price: 400,
            tax_id: null,
            amount: 800,
          },
        ],
      };

      const mapped = mapBillableSubscriptionRow(rawRow);

      expect(mapped.id).toBe("55555555-5555-5555-0000-000000000001");
      expect(mapped.subscriptionId).toBe("55555555-5555-5555-0000-000000000001");
      expect(mapped.number).toBe("SUB-000001");
      expect(mapped.customerId).toBe("11111111-1111-1111-1111-000000000001");
      expect(mapped.customerName).toBe("Acme Technologies");
      expect(mapped.customerEmail).toBe("customer01@example.test");
      expect(mapped.planId).toBe("33333333-3333-3333-3333-000000000003");
      expect(mapped.planName).toBe("Monthly Enterprise Plan");
      expect(mapped.billingPeriod).toBe("monthly");
      expect(mapped.paymentTerms).toBe("net_30");
      expect(mapped.startDate).toBe("2026-09-30");
      expect(mapped.expiryDate).toBe("2027-09-30");
      expect(mapped.nextBillingDate).toBe("2026-10-31");
      expect(mapped.status).toBe("active");
      expect(mapped.periodStart).toBe("2026-10-31");
      expect(mapped.periodEnd).toBe("2026-11-29");
      expect(mapped.subtotal).toBe(3300);
      expect(mapped.taxTotal).toBe(0);
      expect(mapped.totalAmount).toBe(3300);

      expect(mapped.lines).toHaveLength(2);
      expect(mapped.lines[0]).toEqual({
        id: "66666666-6666-6666-0000-000000000001",
        lineId: "66666666-6666-6666-0000-000000000001",
        productId: "22222222-2222-2222-2222-000000000001",
        productName: "Brightloop CRM",
        variantId: "22222222-2222-2222-2222-000000000101",
        quantity: 1,
        unitPrice: 2500,
        taxId: undefined,
        amount: 2500,
      });
      expect(mapped.lines[1]).toEqual({
        id: "77777777-7777-7777-0000-000000000001",
        lineId: "77777777-7777-7777-0000-000000000001",
        productId: "22222222-2222-2222-2222-000000000003",
        productName: "Priority Support Add-on",
        variantId: undefined,
        quantity: 2,
        unitPrice: 400,
        taxId: undefined,
        amount: 800,
      });
    });

    it("handles null or missing lines gracefully", () => {
      const rawRow: BillableSubscriptionRow = {
        subscription_id: "sub-empty",
        number: "SUB-000099",
        customer_id: "cust-1",
        plan_id: "plan-1",
        billing_period: "daily",
        payment_terms: "immediate",
        start_date: "2026-10-01",
        expiry_date: "2026-10-30",
        next_billing_date: "2026-10-02",
        status: "active",
        period_start: "2026-10-02",
        period_end: "2026-10-02",
        lines: null,
        subtotal: 0,
        tax_total: 0,
        total_amount: 0,
      };

      const mapped = mapBillableSubscriptionRow(rawRow);
      expect(mapped.lines).toEqual([]);
      expect(mapped.subtotal).toBe(0);
    });
  });

  describe("getBillableSubscriptions Authorization & Filtering", () => {
    it("rejects customer role before any query executes", async () => {
      vi.mocked(authModule.requireUser).mockResolvedValue({
        id: "cust-1",
        email: "customer01@example.test",
        role: "customer",
      });

      await expect(getBillableSubscriptions()).rejects.toThrow(
        /Unauthorized: only admin and staff can access billable subscriptions/i
      );

      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it("allows admin user and returns mapped records", async () => {
      vi.mocked(authModule.requireUser).mockResolvedValue({
        id: "admin-1",
        email: "admin@brightloop.io",
        role: "admin",
      });

      const mockRow: BillableSubscriptionRow = {
        subscription_id: "sub-1",
        number: "SUB-000001",
        customer_id: "cust-1",
        customer_name: "Customer One",
        customer_email: "cust1@example.test",
        plan_id: "plan-1",
        plan_name: "Standard",
        billing_period: "monthly",
        payment_terms: "net_30",
        start_date: "2026-10-01",
        expiry_date: "2027-10-01",
        next_billing_date: "2026-10-31",
        status: "active",
        period_start: "2026-10-31",
        period_end: "2026-11-29",
        lines: [],
        subtotal: 2500,
        tax_total: 0,
        total_amount: 2500,
      };

      mockQueryBuilder.range.mockResolvedValue({
        data: [mockRow],
        count: 1,
        error: null,
      });

      const result = await getBillableSubscriptions({ page: 1, pageSize: 20 });

      expect(mockSupabase.from).toHaveBeenCalledWith("billable_subscriptions");
      expect(mockQueryBuilder.range).toHaveBeenCalledWith(0, 19);
      expect(result.total).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe("sub-1");
      expect(result.data[0].customerName).toBe("Customer One");
    });

    it("allows finance and support staff roles", async () => {
      vi.mocked(authModule.requireUser).mockResolvedValue({
        id: "staff-fin",
        email: "finance@brightloop.io",
        role: "finance",
      });

      mockQueryBuilder.range.mockResolvedValue({
        data: [],
        count: 0,
        error: null,
      });

      const result = await getBillableSubscriptions();
      expect(result).toEqual({ data: [], total: 0 });
    });

    it("returns empty data and 0 total when page has no results", async () => {
      vi.mocked(authModule.requireUser).mockResolvedValue({
        id: "admin-1",
        email: "admin@brightloop.io",
        role: "admin",
      });

      mockQueryBuilder.range.mockResolvedValue({
        data: [],
        count: 0,
        error: null,
      });

      const result = await getBillableSubscriptions({ page: 2, pageSize: 50 });
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
      expect(mockQueryBuilder.range).toHaveBeenCalledWith(50, 99);
    });

    it("applies asOf filter when supplied", async () => {
      vi.mocked(authModule.requireUser).mockResolvedValue({
        id: "admin-1",
        email: "admin@brightloop.io",
        role: "admin",
      });

      mockQueryBuilder.range.mockResolvedValue({
        data: [],
        count: 0,
        error: null,
      });

      await getBillableSubscriptions({ asOf: "2026-10-31" });
      expect(mockQueryBuilder.lte).toHaveBeenCalledWith("next_billing_date", "2026-10-31");
    });

    it("throws error if database query fails", async () => {
      vi.mocked(authModule.requireUser).mockResolvedValue({
        id: "admin-1",
        email: "admin@brightloop.io",
        role: "admin",
      });

      mockQueryBuilder.range.mockResolvedValue({
        data: null,
        count: null,
        error: { message: "connection timeout" },
      });

      await expect(getBillableSubscriptions()).rejects.toThrow(
        "Failed to fetch billable subscriptions: connection timeout"
      );
    });
  });
});
