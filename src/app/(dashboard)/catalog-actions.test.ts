import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createProductAction,
  deleteProductAction,
  updateProductAction,
} from "./products/actions";
import {
  createPlanAction,
  deletePlanAction,
  updatePlanAction,
} from "./plans/actions";
import * as authModule from "@/lib/auth/require-user";
import * as productsService from "@/services/products.service";
import * as plansService from "@/services/plans.service";

vi.mock("@/lib/auth/require-user", () => ({
  requireUser: vi.fn(),
  getCurrentUser: vi.fn(),
}));

vi.mock("@/services/products.service", () => ({
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
  deleteProduct: vi.fn(),
  listProducts: vi.fn(),
  getProduct: vi.fn(),
}));

vi.mock("@/services/plans.service", () => ({
  createPlan: vi.fn(),
  updatePlan: vi.fn(),
  deletePlan: vi.fn(),
  listPlans: vi.fn(),
  getPlan: vi.fn(),
}));

describe("Catalog Server Actions RBAC & Validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Role-Based Access Control (RBAC)", () => {
    it("allows an admin call to succeed for product actions", async () => {
      vi.mocked(authModule.requireUser).mockResolvedValue({
        id: "admin-1",
        email: "admin@brightloop.io",
        role: "admin",
      });

      const mockProduct = {
        id: "prod-1",
        name: "Fiber Router",
        type: "goods" as const,
        salesPrice: 199.99,
        costPrice: 90,
        createdAt: "2026-10-31T00:00:00Z",
        updatedAt: "2026-10-31T00:00:00Z",
        variants: [],
      };

      vi.mocked(productsService.createProduct).mockResolvedValue(mockProduct);

      const res = await createProductAction({
        name: "Fiber Router",
        type: "goods",
        salesPrice: 199.99,
        costPrice: 90,
      });

      expect(res.success).toBe(true);
      expect(res.data).toEqual(mockProduct);
      expect(productsService.createProduct).toHaveBeenCalledTimes(1);
    });

    it("allows an admin call to succeed for plan actions", async () => {
      vi.mocked(authModule.requireUser).mockResolvedValue({
        id: "admin-1",
        email: "admin@brightloop.io",
        role: "admin",
      });

      const mockPlan = {
        id: "plan-1",
        name: "Pro Monthly",
        price: 49.99,
        billingPeriod: "monthly" as const,
        minQuantity: 1,
        autoClose: false,
        closable: true,
        pausable: true,
        renewable: true,
        createdAt: "2026-10-31T00:00:00Z",
        updatedAt: "2026-10-31T00:00:00Z",
      };

      vi.mocked(plansService.createPlan).mockResolvedValue(mockPlan);

      const res = await createPlanAction({
        name: "Pro Monthly",
        price: 49.99,
        billingPeriod: "monthly",
        minQuantity: 1,
        autoClose: false,
        closable: true,
        pausable: true,
        renewable: true,
      });

      expect(res.success).toBe(true);
      expect(res.data).toEqual(mockPlan);
      expect(plansService.createPlan).toHaveBeenCalledTimes(1);
    });

    it("rejects staff calls before calling any service", async () => {
      vi.mocked(authModule.requireUser).mockResolvedValue({
        id: "staff-1",
        email: "staff@brightloop.io",
        role: "support",
      });

      const resProduct = await createProductAction({
        name: "Staff Attempt",
        type: "service",
        salesPrice: 10,
        costPrice: 5,
      });

      expect(resProduct.success).toBe(false);
      expect(resProduct.error).toMatch(/forbidden|admin/i);
      expect(productsService.createProduct).not.toHaveBeenCalled();

      const resPlan = await createPlanAction({
        name: "Staff Plan Attempt",
        price: 15,
        billingPeriod: "monthly",
      });

      expect(resPlan.success).toBe(false);
      expect(resPlan.error).toMatch(/forbidden|admin/i);
      expect(plansService.createPlan).not.toHaveBeenCalled();
    });

    it("rejects customer calls before calling any service", async () => {
      vi.mocked(authModule.requireUser).mockResolvedValue({
        id: "cust-1",
        email: "customer@example.com",
        role: "customer",
      });

      const resDeleteProduct = await deleteProductAction("prod-123");
      expect(resDeleteProduct.success).toBe(false);
      expect(resDeleteProduct.error).toMatch(/forbidden|admin/i);
      expect(productsService.deleteProduct).not.toHaveBeenCalled();

      const resDeletePlan = await deletePlanAction("plan-123");
      expect(resDeletePlan.success).toBe(false);
      expect(resDeletePlan.error).toMatch(/forbidden|admin/i);
      expect(plansService.deletePlan).not.toHaveBeenCalled();
    });
  });

  describe("Input Validation & Field-Level Errors", () => {
    beforeEach(() => {
      vi.mocked(authModule.requireUser).mockResolvedValue({
        id: "admin-1",
        email: "admin@brightloop.io",
        role: "admin",
      });
    });

    it("returns field-level errors for negative price and empty name without reaching service", async () => {
      const res = await createProductAction({
        name: "   ",
        type: "goods",
        salesPrice: -50,
        costPrice: -10,
      });

      expect(res.success).toBe(false);
      expect(res.fieldErrors).toBeDefined();
      expect(res.fieldErrors?.name).toBeDefined();
      expect(res.fieldErrors?.salesPrice).toBeDefined();
      expect(productsService.createProduct).not.toHaveBeenCalled();
    });

    it("returns field-level errors for minQuantity 0 and invalid billingPeriod without reaching service", async () => {
      const res = await createPlanAction({
        name: "Enterprise Invalid",
        price: -10,
        billingPeriod: "bi-weekly" as any,
        minQuantity: 0,
      });

      expect(res.success).toBe(false);
      expect(res.fieldErrors).toBeDefined();
      expect(res.fieldErrors?.price).toBeDefined();
      expect(res.fieldErrors?.billingPeriod).toBeDefined();
      expect(res.fieldErrors?.minQuantity).toBeDefined();
      expect(plansService.createPlan).not.toHaveBeenCalled();
    });
  });

  describe("Foreign-Key Constraint Error Handling", () => {
    beforeEach(() => {
      vi.mocked(authModule.requireUser).mockResolvedValue({
        id: "admin-1",
        email: "admin@brightloop.io",
        role: "admin",
      });
    });

    it("returns a friendly message when deleting a product used by subscriptions", async () => {
      vi.mocked(productsService.deleteProduct).mockRejectedValue(
        new Error(
          "Cannot delete product because it is currently used by existing subscriptions or quotations."
        )
      );

      const res = await deleteProductAction("prod-active-123");

      expect(res.success).toBe(false);
      expect(res.error).toContain("used by existing subscriptions");
    });

    it("returns a friendly message when deleting a plan used by active subscriptions", async () => {
      vi.mocked(plansService.deletePlan).mockRejectedValue(
        new Error(
          "Cannot delete plan because it is currently used by existing subscriptions or quotation templates."
        )
      );

      const res = await deletePlanAction("plan-active-123");

      expect(res.success).toBe(false);
      expect(res.error).toContain("used by existing subscriptions");
    });
  });
});
