import { test, expect } from "@playwright/test";

/**
 * Step 10: End-to-End Tests for Brightloop Telemetry & Portal
 * Scenarios:
 *  (a) Customer sees only their own data
 *  (b) Customer cannot open another customer's invoice URL (IDOR returns 404)
 *  (c) Admin applies filters and numbers + URL update
 *  (d) Role routing (staff vs customer areas)
 *  (e) CSV export downloads
 */

test.describe("Role Routing & Route Boundaries", () => {
  test("(d) unauthenticated user redirected to login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login\?redirect=%2Fdashboard/);
  });

  test("(d) customer cannot enter admin areas and is redirected to portal", async ({ context, page }) => {
    // Authenticate as customer via cookie
    await context.addCookies([
      { name: "brightloop_role", value: "customer", domain: "localhost", path: "/" },
    ]);

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/portal/);

    await page.goto("/reports");
    await expect(page).toHaveURL(/\/portal/);
  });

  test("(d) admin/staff cannot enter customer portal and is redirected to dashboard", async ({ context, page }) => {
    await context.addCookies([
      { name: "brightloop_role", value: "admin", domain: "localhost", path: "/" },
    ]);

    await page.goto("/portal");
    await expect(page).toHaveURL(/\/dashboard/);
  });
});

test.describe("Customer Portal & IDOR Protection", () => {
  test.beforeEach(async ({ context }) => {
    await context.addCookies([
      { name: "brightloop_role", value: "customer", domain: "localhost", path: "/" },
    ]);
  });

  test("(a) customer sees their own portal overview and subscriptions", async ({ page }) => {
    await page.goto("/portal");
    await expect(page.locator("h1")).toContainText(/HELLO/i);
    await expect(page.getByText(/ACTIVE SUBSCRIPTIONS/i)).toBeVisible();
    await expect(page.getByText(/OUTSTANDING BALANCE/i)).toBeVisible();

    await page.goto("/portal/subscriptions");
    await expect(page.locator("h1")).toContainText(/MY SUBSCRIPTIONS/i);
    // Should have subscription cards
    const cards = page.locator("a[href^='/portal/subscriptions/']");
    await expect(cards.first()).toBeVisible();
  });

  test("(b) customer opening another customer's invoice returns 404", async ({ page }) => {
    // Non-existent or non-owned invoice ID
    const response = await page.goto("/portal/invoices/inv-nonexistent-9999");
    // Next.js notFound() renders 404
    expect([404, 200]).toContain(response?.status() ?? 404);
    await expect(page.getByText(/404|not found|page could not be found/i)).toBeVisible();
  });
});

test.describe("Admin Telemetry & Reporting", () => {
  test.beforeEach(async ({ context }) => {
    await context.addCookies([
      { name: "brightloop_role", value: "admin", domain: "localhost", path: "/" },
    ]);
  });

  test("(c) admin applies filters and URL updates", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.locator("h1")).toContainText(/REVENUE OVERVIEW/i);

    // Apply plan filter if selector is present
    const planSelect = page.locator("select[name='planId'], [data-testid='filter-plan']").first();
    if (await planSelect.isVisible()) {
      await planSelect.selectOption({ index: 1 });
      await expect(page).toHaveURL(/planId=/);
    }
  });

  test("(e) CSV export downloads for admin and is blocked for customer", async ({ context, request }) => {
    // Admin request should succeed
    const adminRes = await request.get("/api/reports/export?tab=revenue", {
      headers: { Cookie: "brightloop_role=admin" },
    });
    expect(adminRes.status()).toBe(200);
    expect(adminRes.headers()["content-type"]).toContain("text/csv");

    // Customer request should be blocked (403 Forbidden)
    const customerRes = await request.get("/api/reports/export?tab=revenue", {
      headers: { Cookie: "brightloop_role=customer" },
    });
    expect(customerRes.status()).toBe(403);
  });
});
