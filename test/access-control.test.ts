import { describe, it, expect, beforeEach } from "vitest";
import {
  getMySubscription,
  getMyInvoice,
  getMySubscriptions,
  getMyInvoices,
  getMyPayments,
} from "@/lib/data/portal";
import { getMockStore } from "@/lib/data/mock-generator";
import { middleware } from "@/middleware";
import { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth";

// ─── helpers ────────────────────────────────────────────────────────────────

function createMockRequest(url: string, role?: string): NextRequest {
  const req = new NextRequest(new URL(url, "http://localhost:3000"));
  if (role) req.cookies.set(AUTH_COOKIE_NAME, role);
  return req;
}

// ============================================================================
// STEP 9 — OWNERSHIP CHECKS
// Proves that cross-customer access is blocked in every portal data function.
// ============================================================================

describe("Step 9 – Portal Ownership Checks", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_USE_MOCK_DATA = "true";
  });

  // ── Subscriptions ──────────────────────────────────────────────────────────

  it("getMySubscriptions returns ONLY rows for the requesting customer", async () => {
    const store = getMockStore();
    const custA = store.customers[0].id;
    const custB = store.customers[1]?.id;

    const subsA = await getMySubscriptions(custA);
    expect(subsA.length).toBeGreaterThan(0);
    // Every returned subscription must belong to custA
    subsA.forEach((s) => {
      expect(s.customerId).toBe(custA);
    });

    if (custB) {
      const subsB = await getMySubscriptions(custB);
      expect(subsB.length).toBeGreaterThan(0);
      subsB.forEach((s) => {
        expect(s.customerId).toBe(custB);
      });
      // Cross-check: custA's subs should not appear in custB's result
      const idsA = new Set(subsA.map((s) => s.id));
      const idsB = new Set(subsB.map((s) => s.id));
      const overlap = Array.from(idsA).filter((id) => idsB.has(id));
      expect(overlap.length).toBe(0);
    }
  });

  it("getMySubscription returns null for a wrong customerId (IDOR blocked)", async () => {
    const store = getMockStore();
    // Find a subscription that belongs to customers[1]
    const sub = store.subscriptions.find(
      (s) => s.customerId !== store.customers[0].id
    );
    if (!sub) return; // skip if mock data only has one customer

    // customers[0] tries to access customers[1]'s subscription
    const wrongCustomerId = store.customers[0].id;
    const result = await getMySubscription(sub.id, wrongCustomerId);
    // Should be null (the page calls notFound() on null)
    expect(result).toBeNull();
  });

  it("getMySubscription returns the subscription for the correct owner", async () => {
    const store = getMockStore();
    const sub = store.subscriptions[0];
    const result = await getMySubscription(sub.id, sub.customerId);
    expect(result).not.toBeNull();
    expect(result?.id).toBe(sub.id);
  });

  // ── Invoices ───────────────────────────────────────────────────────────────

  it("getMyInvoices returns ONLY rows for the requesting customer", async () => {
    const store = getMockStore();
    const custA = store.customers[0].id;
    const result = await getMyInvoices(custA, 1, 100);
    expect(result.data.length).toBeGreaterThan(0);
    result.data.forEach((inv) => {
      expect(inv.customerId).toBe(custA);
    });
  });

  it("getMyInvoice returns null for a wrong customerId (IDOR blocked)", async () => {
    const store = getMockStore();
    // Find an invoice that belongs to customers[1]
    const inv = store.invoices.find(
      (i) => i.customerId !== store.customers[0].id
    );
    if (!inv) return;

    const wrongCustomerId = store.customers[0].id;
    const result = await getMyInvoice(inv.id, wrongCustomerId);
    expect(result).toBeNull();
  });

  it("getMyInvoice returns the invoice for the correct owner", async () => {
    const store = getMockStore();
    const inv = store.invoices[0];
    const result = await getMyInvoice(inv.id, inv.customerId);
    expect(result).not.toBeNull();
    expect(result?.id).toBe(inv.id);
  });

  it("getMyInvoice injects computed lines when invoice has none", async () => {
    const store = getMockStore();
    const inv = store.invoices[0];
    const result = await getMyInvoice(inv.id, inv.customerId);
    expect(result?.lines).toBeDefined();
    expect(result!.lines!.length).toBeGreaterThan(0);
  });

  // ── Payments ───────────────────────────────────────────────────────────────

  it("getMyPayments returns ONLY rows for the requesting customer", async () => {
    const store = getMockStore();
    const custA = store.customers[0].id;
    const payments = await getMyPayments(custA);
    expect(payments.length).toBeGreaterThan(0);
    payments.forEach((p) => {
      expect(p.customerId).toBe(custA);
    });
  });
});

// ============================================================================
// STEP 9 – MIDDLEWARE ROUTE GUARDS
// Verifies that all cross-role accesses are blocked by middleware.
// ============================================================================

describe("Step 9 – Middleware Cross-Role Guards", () => {
  it("blocks customer from /dashboard", () => {
    const res = middleware(createMockRequest("/dashboard", "customer"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/portal");
  });

  it("blocks customer from /reports", () => {
    const res = middleware(createMockRequest("/reports", "customer"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/portal");
  });

  it("blocks customer from CSV export API and returns 403", () => {
    const res = middleware(
      createMockRequest("/api/reports/export", "customer")
    );
    expect(res.status).toBe(403);
  });

  it("blocks admin from /portal and redirects to /dashboard", () => {
    const res = middleware(createMockRequest("/portal", "admin"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/dashboard");
  });

  it("blocks staff from /portal/invoices and redirects to /dashboard", () => {
    const res = middleware(createMockRequest("/portal/invoices", "staff"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/dashboard");
  });

  it("allows customer to access /portal/invoices", () => {
    const res = middleware(
      createMockRequest("/portal/invoices", "customer")
    );
    expect(res.headers.get("location")).toBeNull();
  });

  it("allows customer to access /portal/payments", () => {
    const res = middleware(
      createMockRequest("/portal/payments", "customer")
    );
    expect(res.headers.get("location")).toBeNull();
  });

  it("allows admin to access /api/reports/export", () => {
    const res = middleware(
      createMockRequest("/api/reports/export", "admin")
    );
    expect(res.status).not.toBe(403);
    expect(res.headers.get("location")).toBeNull();
  });

  it("allows staff to access /api/reports/export", () => {
    const res = middleware(
      createMockRequest("/api/reports/export", "staff")
    );
    expect(res.status).not.toBe(403);
    expect(res.headers.get("location")).toBeNull();
  });

  it("blocks unauthenticated user from /api/reports/export", () => {
    const res = middleware(createMockRequest("/api/reports/export"));
    // Redirected to /login (307) or 401/403 — must not be 200
    expect(res.status).toBeGreaterThanOrEqual(300);
  });
});

