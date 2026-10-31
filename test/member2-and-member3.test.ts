import { describe, it, expect, beforeEach } from "vitest";
import { resetMockDb, getMockDb } from "@/lib/services/../mock/db";
import {
  listProducts,
  getProductById,
  createProduct,
  calculateEffectivePrice,
  toggleArchiveProduct,
} from "@/lib/services/products";
import {
  listPlans,
  createPlan,
  validatePlanAvailability,
  validatePlanQuantity,
} from "@/lib/services/plans";
import {
  listQuotationTemplates,
  createQuotationTemplate,
  createQuotationFromTemplate,
} from "@/lib/services/quotations";
import {
  listSubscriptions,
  getSubscriptionById,
  createSubscription,
  transitionSubscription,
  pauseSubscription,
  closeEarlySubscription,
  renewSubscription,
  runScheduler,
} from "@/lib/services/subscriptions";
import { listTaxes, createTaxRule, calculateLineTaxes } from "@/lib/services/taxes";
import {
  listDiscounts,
  createDiscountRule,
  applyDiscountCode,
  isDiscountExpired,
  isDiscountLimitReached,
} from "@/lib/services/discounts";
import { runBillingEngine, listBillingRuns } from "@/lib/services/billing";
import { listInvoices, getInvoiceById, confirmInvoice, cancelInvoice } from "@/lib/services/invoices";
import { recordPayment, listPayments } from "@/lib/services/payments";

describe("Part 2: Member 2 (Products, Plans, Quotations, Subscriptions & Lifecycle)", () => {
  beforeEach(() => {
    resetMockDb();
  });

  describe("Product & Variant Pricing Rules", () => {
    it("calculates effective price: base + extra variant price (Odoo adds ₹560)", async () => {
      const prods = await listProducts();
      const telemetryEngine = prods.find((p) => p.id === "prod-001");
      expect(telemetryEngine).toBeDefined();

      const odooVariant = telemetryEngine?.variants.find((v) => v.attributeValue === "Odoo");
      expect(odooVariant).toBeDefined();
      expect(odooVariant?.extraPrice).toBe(560);

      const standardPrice = calculateEffectivePrice(telemetryEngine!);
      expect(standardPrice).toBe(12000);

      const odooEffectivePrice = calculateEffectivePrice(telemetryEngine!, odooVariant?.id);
      expect(odooEffectivePrice).toBe(12560); // 12000 + 560
    });

    it("creates a product with brand variants and archives it", async () => {
      const newProd = await createProduct(
        {
          name: "Edge Sentinel Box",
          type: "storable",
          salesPrice: 5000,
          costPrice: 2000,
          variants: [
            { attributeName: "Brand", attributeValue: "Standard", extraPrice: 0 },
            { attributeName: "Brand", attributeValue: "Odoo", extraPrice: 560 },
          ],
        },
        "admin"
      );

      expect(newProd.id).toBeDefined();
      expect(newProd.variants).toHaveLength(2);
      expect(newProd.archived).toBe(false);

      const archived = await toggleArchiveProduct(newProd.id, true, "admin");
      expect(archived.archived).toBe(true);
    });
  });

  describe("Plan Availability Windows & Minimum Quantity", () => {
    it("validates plan availability window correctly", async () => {
      const plans = await listPlans();
      const stdPlan = plans.find((p) => p.id === "plan-std-monthly")!;
      expect(validatePlanAvailability(stdPlan, "2026-06-01").valid).toBe(true);

      // Outside window check
      const outOfWindow = validatePlanAvailability(stdPlan, "2025-12-31");
      expect(outOfWindow.valid).toBe(false);
      expect(outOfWindow.reason).toContain("not available until");
    });

    it("enforces minimum plan quantity", async () => {
      const plans = await listPlans();
      const entPlan = plans.find((p) => p.id === "plan-ent-annual")!;
      expect(entPlan.minimumQuantity).toBe(10);

      expect(validatePlanQuantity(entPlan, 5).valid).toBe(false);
      expect(validatePlanQuantity(entPlan, 10).valid).toBe(true);
      expect(validatePlanQuantity(entPlan, 15).valid).toBe(true);
    });
  });

  describe("Quotation Templates & Fast Provisioning", () => {
    it("creates quotation from template in 1 click and sets validity date", async () => {
      const templates = await listQuotationTemplates();
      const tmpl = templates[0];
      expect(tmpl).toBeDefined();

      const sub = await createQuotationFromTemplate(tmpl.id, "cust-001", {
        name: "Sales Agent",
        role: "staff",
      });

      expect(sub.id).toBeDefined();
      expect(sub.status).toBe("quotation");
      expect(sub.validUntil).toBeDefined();
      expect(sub.history).toHaveLength(1);
      expect(sub.history?.[0].reason).toContain(tmpl.name);
    });

    it("rejects confirmation if quotation is expired", async () => {
      const templates = await listQuotationTemplates();
      const sub = await createQuotationFromTemplate(templates[0].id, "cust-001");

      // Artificially expire the quotation
      sub.validUntil = "2026-01-01";
      const db = getMockDb();
      const idx = db.store.subscriptions.findIndex((s) => s.id === sub.id);
      db.store.subscriptions[idx] = sub;

      await expect(
        transitionSubscription(sub.id, "confirmed", { name: "Agent", role: "staff" })
      ).rejects.toThrow(/Expired quotations cannot be confirmed/);
    });
  });

  describe("Lifecycle State Machine & Policy Flags", () => {
    it("strictly follows legal transitions: draft -> quotation -> confirmed -> active -> closed", async () => {
      const sub = await createSubscription({
        customerId: "cust-001",
        planId: "plan-pro-monthly",
        startDate: "2026-10-31",
        lines: [{ productId: "prod-001", quantity: 2, unitPrice: 12000 }],
      });
      expect(sub.status).toBe("draft");

      // Illegal transition: draft directly to active
      await expect(
        transitionSubscription(sub.id, "active", { name: "Admin", role: "admin" })
      ).rejects.toThrow(/Illegal state transition/);

      // Legal transition 1: draft -> quotation
      const quote = await transitionSubscription(sub.id, "quotation", { name: "Admin", role: "admin" });
      expect(quote.status).toBe("quotation");

      // Legal transition 2: quotation -> confirmed
      const confirmed = await transitionSubscription(sub.id, "confirmed", { name: "Admin", role: "admin" });
      expect(confirmed.status).toBe("confirmed");

      // Legal transition 3: confirmed -> active
      const active = await transitionSubscription(sub.id, "active", { name: "Admin", role: "admin" });
      expect(active.status).toBe("active");

      // Legal transition 4: active -> closed
      const closed = await transitionSubscription(sub.id, "closed", { name: "Admin", role: "admin" });
      expect(closed.status).toBe("closed");

      // Cannot reopen closed contract
      await expect(
        transitionSubscription(sub.id, "quotation", { name: "Admin", role: "admin" })
      ).rejects.toThrow(/Illegal state transition/);
    });

    it("respects plan pause, early close, and renew flags", async () => {
      const db = getMockDb();
      // plan-pro-monthly has pausable: true, closableEarly: true, renewable: true
      const sub = db.store.subscriptions.find(
        (s) => s.status === "active" && s.planId === "plan-pro-monthly"
      )!;

      // Pause toggle
      const paused = await pauseSubscription(sub.id, { name: "Admin", role: "admin" });
      expect(paused.paused).toBe(true);

      const resumed = await pauseSubscription(sub.id, { name: "Admin", role: "admin" });
      expect(resumed.paused).toBe(false);

      // Renew
      const renewed = await renewSubscription(sub.id, { name: "Admin", role: "admin" });
      expect(new Date(renewed.endDate).getFullYear()).toBeGreaterThanOrEqual(2027);

      // Early close
      const closed = await closeEarlySubscription(sub.id, { name: "Admin", role: "admin" });
      expect(closed.status).toBe("closed");
    });

    it("runs mock daily scheduler and auto-closes expired autoClose subscriptions", async () => {
      const db = getMockDb();
      // Find an active subscription with plan-daily-eval (autoClose: true)
      const sub = db.store.subscriptions.find((s) => s.status === "active")!;
      sub.plan = db.store.plans.find((p) => p.id === "plan-daily-eval")!;
      sub.planId = sub.plan.id;
      sub.endDate = "2026-10-01"; // past date

      const res = await runScheduler("admin");
      expect(res.closedCount).toBeGreaterThanOrEqual(1);
      expect(res.closedIds).toContain(sub.id);

      const rechecked = await getSubscriptionById(sub.id);
      expect(rechecked?.status).toBe("closed");
      expect(rechecked?.history?.[0].reason).toContain("Auto-closed on term completion");
    });
  });
});

describe("Part 3: Member 3 (Taxes, Discounts, Idempotent Billing Engine, Invoices & Payments)", () => {
  beforeEach(() => {
    resetMockDb();
  });

  describe("Tax Calculations", () => {
    it("calculates line item taxes accurately with breakdowns", async () => {
      const db = getMockDb();
      const { totalTax, breakdown } = calculateLineTaxes(10000, "prod-001", db.store.taxes);

      // GST 18% (1800) + IT Cess 2% (200) = 2000
      expect(totalTax).toBe(2000);
      expect(breakdown).toHaveLength(2);
      expect(breakdown[0].amount).toBe(1800);
      expect(breakdown[1].amount).toBe(200);
    });
  });

  describe("Discount Coupon Rules", () => {
    it("applies valid discount coupon and increments usage count atomically", async () => {
      const beforeRules = await listDiscounts();
      const diwaliRule = beforeRules.find((d) => d.code === "DIWALI20")!;
      const countBefore = diwaliRule.usageCount;

      const { discountAmount, rule } = await applyDiscountCode("DIWALI20", 20000);
      expect(discountAmount).toBe(4000); // 20% of 20000
      expect(rule.usageCount).toBe(countBefore + 1);
    });

    it("rejects expired discount code and codes at usage limit", async () => {
      await expect(applyDiscountCode("SUMMER2025", 10000)).rejects.toThrow(/expired/);
      await expect(applyDiscountCode("FLASH100", 10000)).rejects.toThrow(/reached its maximum usage limit/);
    });
  });

  describe("Idempotent Billing Engine", () => {
    it("generates invoices for active subscriptions and guarantees ZERO duplicates on re-run", async () => {
      const firstRun = await runBillingEngine({ name: "System Admin", role: "admin" });
      expect(firstRun.invoicesCreated).toBeGreaterThan(0);
      expect(firstRun.failedCount).toBe(0);

      // Second run immediately following: must produce 0 duplicate invoices!
      const secondRun = await runBillingEngine({ name: "System Admin", role: "admin" });
      expect(secondRun.invoicesCreated).toBe(0);
      expect(secondRun.invoicesSkipped).toBe(firstRun.subscriptionsProcessed);
    });
  });

  describe("Payments & Overpayment Prevention", () => {
    it("records partial payment, updates balance, and prevents overpayment", async () => {
      const invoices = await listInvoices({ overdueOnly: true });
      const inv = invoices.data[0];
      const initialBalance = inv.balance;
      expect(initialBalance).toBeGreaterThan(0);

      // Partial payment
      const partialPay = await recordPayment({
        invoiceId: inv.id,
        amount: 5000,
        method: "upi",
        note: "Partial advance",
      });

      expect(partialPay.amount).toBe(5000);
      const updatedInv = await getInvoiceById(inv.id);
      expect(updatedInv?.balance).toBe(initialBalance - 5000);

      // Overpayment attempt: paying more than remaining balance
      await expect(
        recordPayment({
          invoiceId: inv.id,
          amount: updatedInv!.balance + 1000,
          method: "upi",
        })
      ).rejects.toThrow(/exceeds invoice balance/);

      // Settle full remaining balance
      await recordPayment({
        invoiceId: inv.id,
        amount: updatedInv!.balance,
        method: "credit_card",
      });

      const settledInv = await getInvoiceById(inv.id);
      expect(settledInv?.balance).toBe(0);
      expect(settledInv?.status).toBe("paid");
    });
  });
});
