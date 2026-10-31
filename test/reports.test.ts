import { describe, it, expect, beforeEach } from "vitest";
import { getReportRows, getReportSummary } from "@/lib/data/dashboard";
import { ReportTab } from "@/types";

describe("Reports Engine & Summary Analytics", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_USE_MOCK_DATA = "true";
  });

  const tabs: ReportTab[] = ["subscriptions", "revenue", "payments", "invoices"];

  tabs.forEach((tab) => {
    it(`fetches paginated rows for tab '${tab}'`, async () => {
      const result = await getReportRows(tab, {}, 1, { column: "date", direction: "desc" }, 10);
      expect(result.data).toBeDefined();
      expect(result.data.length).toBeLessThanOrEqual(10);
      expect(result.total).toBeGreaterThan(0);
      expect(result.page).toBe(1);
    });

    it(`generates 3 summary stat boxes for tab '${tab}'`, async () => {
      const summary = await getReportSummary(tab, {});
      expect(summary.stat1).toBeDefined();
      expect(summary.stat1.label).toBeTruthy();
      expect(summary.stat1.value).toBeTruthy();

      expect(summary.stat2).toBeDefined();
      expect(summary.stat2.label).toBeTruthy();
      expect(summary.stat2.value).toBeTruthy();

      expect(summary.stat3).toBeDefined();
      expect(summary.stat3.label).toBeTruthy();
      expect(summary.stat3.value).toBeTruthy();
    });
  });

  it("filters subscriptions by status 'active'", async () => {
    const allSubs = await getReportRows("subscriptions", {}, 1, { column: "date", direction: "desc" }, 5000);
    const activeSubs = await getReportRows(
      "subscriptions",
      { status: "active" },
      1,
      { column: "date", direction: "desc" },
      5000
    );

    expect(activeSubs.total).toBeLessThan(allSubs.total);
    expect(activeSubs.data.every((r) => r.badgeStatus === "active")).toBe(true);
  });

  it("filters invoices by customer", async () => {
    const aeroInvoices = await getReportRows(
      "invoices",
      { customerId: "aerogroup" },
      1,
      { column: "date", direction: "desc" },
      50
    );

    expect(aeroInvoices.total).toBeGreaterThan(0);
    expect(aeroInvoices.data.every((r) => r.name.toLowerCase().includes("aero"))).toBe(true);
  });

  it("sorts rows ascending and descending by amount", async () => {
    const descResult = await getReportRows("revenue", {}, 1, { column: "metric1", direction: "desc" }, 10);
    const ascResult = await getReportRows("revenue", {}, 1, { column: "metric1", direction: "asc" }, 10);

    expect(descResult.data[0].metric1).toBeGreaterThanOrEqual(descResult.data[descResult.data.length - 1].metric1);
    expect(ascResult.data[0].metric1).toBeLessThanOrEqual(ascResult.data[ascResult.data.length - 1].metric1);
  });
});
