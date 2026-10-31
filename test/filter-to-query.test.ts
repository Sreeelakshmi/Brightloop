import { describe, it, expect, beforeEach } from "vitest";
import { getOverdueInvoices, getReportRows } from "@/lib/data/dashboard";

describe("Filter-to-Query & Pagination Engine", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_USE_MOCK_DATA = "true";
  });

  it("paginates overdue invoices correctly with 5 items per page and 37 total items", async () => {
    const page1 = await getOverdueInvoices({}, 1, { column: "daysOverdue", direction: "desc" }, 5);

    expect(page1.total).toBe(37);
    expect(page1.page).toBe(1);
    expect(page1.pageSize).toBe(5);
    expect(page1.totalPages).toBe(8); // ceil(37/5) = 8
    expect(page1.data).toHaveLength(5);

    // Verify first two match reference mockup: INV-2901 and INV-2902
    expect(page1.data[0].invoiceNo).toBe("INV-2901");
    expect(page1.data[0].daysOverdue).toBe(16);
    expect(page1.data[0].balance).toBe(148200);

    expect(page1.data[1].invoiceNo).toBe("INV-2902");
    expect(page1.data[1].daysOverdue).toBe(16);
    expect(page1.data[1].balance).toBe(148200);
  });

  it("fetches page 2 with subsequent records", async () => {
    const page2 = await getOverdueInvoices({}, 2, { column: "daysOverdue", direction: "desc" }, 5);

    expect(page2.page).toBe(2);
    expect(page2.data).toHaveLength(5);
    expect(page2.data[0].invoiceNo).not.toBe("INV-2901");
  });

  it("sorts overdue invoices ascending and descending", async () => {
    const ascResult = await getOverdueInvoices({}, 1, { column: "balance", direction: "asc" }, 10);
    const descResult = await getOverdueInvoices({}, 1, { column: "balance", direction: "desc" }, 10);

    expect(ascResult.data[0].balance).toBeLessThanOrEqual(descResult.data[0].balance);
  });

  it("filters overdue invoices by search term", async () => {
    const searchResult = await getOverdueInvoices({ search: "INV-2901" }, 1);

    expect(searchResult.total).toBe(1);
    expect(searchResult.data[0].invoiceNo).toBe("INV-2901");
  });

  it("supports report tabs (revenue, subscriptions, invoices, payments)", async () => {
    const revenueReport = await getReportRows("revenue", {}, 1, { column: "date", direction: "desc" }, 10);
    expect(revenueReport.data).toHaveLength(10);
    expect(revenueReport.total).toBeGreaterThan(50);

    const subsReport = await getReportRows("subscriptions", {}, 1, { column: "date", direction: "desc" }, 10);
    expect(subsReport.data).toHaveLength(10);
    expect(subsReport.total).toBe(2240); // Matches mock subscription count
  });
});

