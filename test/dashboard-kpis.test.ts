import { describe, it, expect, beforeEach } from "vitest";
import {
  getDashboardKpis,
  getRevenueOverTime,
  getSubscriptionsByStatus,
  getPaymentsByMethod,
  shouldUseMockData,
} from "@/lib/data/dashboard";
import { getMockStore } from "@/lib/data/mock-generator";

describe("Dashboard KPI Calculations & Mock Engine", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_USE_MOCK_DATA = "true";
  });

  it("confirms mock mode is active by default in offline/test environment", () => {
    expect(shouldUseMockData()).toBe(true);
  });

  it("returns exact reference telemetry KPIs with 2,200+ subscriptions in store", async () => {
    const startTime = performance.now();
    const kpis = await getDashboardKpis();
    const duration = performance.now() - startTime;

    // Verify benchmark telemetry numbers matching reference screenshot
    expect(kpis.totalRevenue).toBe(4892500);
    expect(kpis.activeSubscriptions).toBe(1284);
    expect(kpis.outstandingPayments).toBe(641200);
    expect(kpis.overdueInvoices).toBe(37);
    expect(kpis.collectionRate).toBeGreaterThan(80);
    expect(kpis.mrr).toBeGreaterThan(0);
    expect(kpis.arr).toBe(kpis.mrr * 12);

    // Verify instantaneous performance (< 50ms for 2,200+ records)
    expect(duration).toBeLessThan(50);
  });

  it("accurately filters KPIs when scoped to a specific customer", async () => {
    const store = getMockStore();
    const targetCustId = store.customers[0].id; // AeroGroup

    const scopedKpis = await getDashboardKpis({ customerId: targetCustId });

    expect(scopedKpis.activeSubscriptions).toBeLessThan(1284);
    expect(scopedKpis.activeSubscriptions).toBeGreaterThan(0);
    expect(scopedKpis.outstandingPayments).toBeGreaterThan(0);
  });

  it("calculates revenue over time with latest period flagged for orange accent highlighting", async () => {
    const data = await getRevenueOverTime();

    expect(data.length).toBeGreaterThan(0);
    const latest = data[data.length - 1];
    expect(latest.highlighted).toBe(true);
    expect(latest.revenue).toBe(4892500);

    const nonLatest = data.slice(0, -1);
    nonLatest.forEach((pt) => {
      expect(pt.highlighted).toBe(false);
    });
  });

  it("returns subscriptions by status with correct percentage breakdown", async () => {
    const breakdown = await getSubscriptionsByStatus();

    expect(breakdown).toHaveLength(5);
    const activeEntry = breakdown.find((b) => b.status === "active");
    expect(activeEntry).toBeDefined();
    expect(activeEntry?.count).toBe(1284);
    expect(activeEntry?.percentage).toBeGreaterThan(50);

    // Verify all percentage components sum to approximately 100%
    const totalPercentage = breakdown.reduce((acc, curr) => acc + curr.percentage, 0);
    expect(Math.round(totalPercentage)).toBeCloseTo(100, 0);
  });

  it("returns payments by method matching donut chart segments", async () => {
    const methods = await getPaymentsByMethod();

    expect(methods).toHaveLength(4);
    const directDebit = methods.find((m) => m.method === "direct_debit");
    expect(directDebit).toBeDefined();
    expect(directDebit?.percentage).toBe(52);
    expect(directDebit?.colorHex).toBe("#2B302B");

    const wire = methods.find((m) => m.method === "wire_transfer");
    expect(wire?.colorHex).toBe("#F57B4A"); // Orange accent
  });
});

