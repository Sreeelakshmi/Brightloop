import { describe, it, expect, beforeEach } from "vitest";
import { getMySubscriptions, getMySubscription } from "@/lib/data/portal";
import { getMockStore } from "@/lib/data/mock-generator";

describe("Customer Portal & Subscription Lifecycle Engine", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_USE_MOCK_DATA = "true";
  });

  it("retrieves subscriptions for customer 'cust-001'", async () => {
    const subs = await getMySubscriptions("cust-001");
    expect(subs).toBeDefined();
    expect(subs.length).toBeGreaterThan(0);
    expect(subs[0].subscriptionNumber).toMatch(/^SUB-/);
  });

  it("retrieves a single subscription with itemized order lines", async () => {
    const subs = await getMySubscriptions("cust-001");
    const firstSub = subs[0];

    const detail = await getMySubscription(firstSub.id, "cust-001");
    expect(detail).toBeDefined();
    expect(detail?.id).toBe(firstSub.id);
    expect(detail?.lines).toBeDefined();
    expect(detail?.lines?.length).toBeGreaterThan(0);
    expect(detail?.lines?.[0].unitPrice).toBeGreaterThan(0);
  });

  it("verifies diverse plan capability flag combinations for Member 2 lifecycle permissions", async () => {
    const store = getMockStore();
    const entPlan = store.plans.find((p) => p.id === "plan-ent-annual");
    const proPlan = store.plans.find((p) => p.id === "plan-pro-monthly");
    const starterPlan = store.plans.find((p) => p.id === "plan-starter");

    expect(entPlan?.renewable).toBe(true);
    expect(entPlan?.pausable).toBe(false);
    expect(entPlan?.closable).toBe(true);

    expect(proPlan?.renewable).toBe(true);
    expect(proPlan?.pausable).toBe(true);
    expect(proPlan?.closable).toBe(true);

    expect(starterPlan?.renewable).toBe(false);
    expect(starterPlan?.pausable).toBe(false);
    expect(starterPlan?.closable).toBe(true);
  });
});
