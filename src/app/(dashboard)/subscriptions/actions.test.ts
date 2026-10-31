import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  changeSubscriptionStatusAction,
  createSubscriptionDraftAction,
  createSubscriptionFromTemplateAction,
  renewSubscriptionAction,
} from "./actions";
import * as authModule from "@/lib/auth/require-user";
import * as subscriptionsService from "@/services/subscriptions.service";

vi.mock("@/lib/auth/require-user", () => ({
  requireUser: vi.fn(),
  getCurrentUser: vi.fn(),
}));

vi.mock("@/services/subscriptions.service", () => ({
  createSubscriptionFromTemplate: vi.fn(),
  createSubscriptionDraft: vi.fn(),
  changeSubscriptionStatus: vi.fn(),
  renewSubscription: vi.fn(),
  listSubscriptions: vi.fn(),
  getSubscription: vi.fn(),
}));

describe("Subscription Server Actions (RBAC, Validation & Error Mapping)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Role Authorization", () => {
    it("allows admin call to succeed", async () => {
      vi.mocked(authModule.requireUser).mockResolvedValue({
        id: "admin-1",
        email: "admin@brightloop.io",
        role: "admin",
      });

      const mockSub: any = { id: "sub-1", number: "SUB-000001", status: "quotation" };
      vi.mocked(subscriptionsService.changeSubscriptionStatus).mockResolvedValue(mockSub);

      const res = await changeSubscriptionStatusAction("sub-1", "quotation");
      expect(res.success).toBe(true);
      expect(res.data).toEqual(mockSub);
      expect(subscriptionsService.changeSubscriptionStatus).toHaveBeenCalledWith("sub-1", "quotation");
    });

    it("allows staff call to succeed", async () => {
      vi.mocked(authModule.requireUser).mockResolvedValue({
        id: "staff-1",
        email: "staff@brightloop.io",
        role: "support",
      });

      const mockSub: any = { id: "sub-1", number: "SUB-000001", status: "active" };
      vi.mocked(subscriptionsService.renewSubscription).mockResolvedValue(mockSub);

      const res = await renewSubscriptionAction("sub-1");
      expect(res.success).toBe(true);
      expect(subscriptionsService.renewSubscription).toHaveBeenCalledWith("sub-1");
    });

    it("rejects customer calls before reaching any service", async () => {
      vi.mocked(authModule.requireUser).mockResolvedValue({
        id: "cust-1",
        email: "customer@example.com",
        role: "customer",
      });

      const resChange = await changeSubscriptionStatusAction("sub-1", "active");
      expect(resChange.success).toBe(false);
      expect(resChange.error).toMatch(/forbidden|customer/i);
      expect(subscriptionsService.changeSubscriptionStatus).not.toHaveBeenCalled();

      const resRenew = await renewSubscriptionAction("sub-1");
      expect(resRenew.success).toBe(false);
      expect(resRenew.error).toMatch(/forbidden|customer/i);
      expect(subscriptionsService.renewSubscription).not.toHaveBeenCalled();

      const resCreate = await createSubscriptionDraftAction({
        customerId: "cust-1",
        planId: "plan-1",
        startDate: "2026-01-01",
        expiryDate: "2026-02-01",
        paymentTerms: "immediate",
        lines: [{ productId: "p-1", quantity: 1, unitPrice: 50, amount: 50 }],
      });
      expect(resCreate.success).toBe(false);
      expect(resCreate.error).toMatch(/forbidden|customer/i);
      expect(subscriptionsService.createSubscriptionDraft).not.toHaveBeenCalled();
    });
  });

  describe("Validation & Field Errors", () => {
    beforeEach(() => {
      vi.mocked(authModule.requireUser).mockResolvedValue({
        id: "admin-1",
        email: "admin@brightloop.io",
        role: "admin",
      });
    });

    it("returns field errors when expiryDate is before startDate and never calls service", async () => {
      const res = await createSubscriptionDraftAction({
        customerId: "cust-1",
        planId: "plan-1",
        startDate: "2026-06-01",
        expiryDate: "2026-01-01", // Invalid date order
        paymentTerms: "immediate",
        lines: [{ productId: "p-1", quantity: 1, unitPrice: 50, amount: 50 }],
      });

      expect(res.success).toBe(false);
      expect(res.fieldErrors).toBeDefined();
      expect(res.fieldErrors?.expiryDate).toBeDefined();
      expect(subscriptionsService.createSubscriptionDraft).not.toHaveBeenCalled();
    });

    it("returns field errors for empty lines array", async () => {
      const res = await createSubscriptionDraftAction({
        customerId: "cust-1",
        planId: "plan-1",
        startDate: "2026-01-01",
        expiryDate: "2026-02-01",
        paymentTerms: "immediate",
        lines: [], // Invalid: needs at least one line
      });

      expect(res.success).toBe(false);
      expect(res.fieldErrors?.lines).toBeDefined();
      expect(subscriptionsService.createSubscriptionDraft).not.toHaveBeenCalled();
    });
  });

  describe("Database Error Translation", () => {
    beforeEach(() => {
      vi.mocked(authModule.requireUser).mockResolvedValue({
        id: "admin-1",
        email: "admin@brightloop.io",
        role: "admin",
      });
    });

    it("translates invalid transition error into readable message", async () => {
      vi.mocked(subscriptionsService.changeSubscriptionStatus).mockRejectedValue(
        new Error("Invalid transition: draft -> active")
      );

      const res = await changeSubscriptionStatusAction("sub-1", "active");
      expect(res.success).toBe(false);
      expect(res.error).toBe("Invalid transition: draft -> active");
    });

    it("translates plan pausing restriction error into user-friendly message", async () => {
      vi.mocked(subscriptionsService.changeSubscriptionStatus).mockRejectedValue(
        new Error("Plan does not allow pausing")
      );

      const res = await changeSubscriptionStatusAction("sub-1", "paused");
      expect(res.success).toBe(false);
      expect(res.error).toContain("does not allow pausing contracts");
    });

    it("translates plan closing restriction error into user-friendly message", async () => {
      vi.mocked(subscriptionsService.changeSubscriptionStatus).mockRejectedValue(
        new Error("Plan does not allow closing")
      );

      const res = await changeSubscriptionStatusAction("sub-1", "closed");
      expect(res.success).toBe(false);
      expect(res.error).toContain("does not allow premature cancellation or closing");
    });
  });
});
