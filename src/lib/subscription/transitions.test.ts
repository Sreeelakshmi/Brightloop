import { describe, expect, it } from "vitest";
import {
  ALLOWED_TRANSITIONS,
  canTransition,
  getAllowedTransitions,
} from "./transitions";
import type { SubscriptionStatus } from "@/types/subscription";

const ALL_STATUSES: SubscriptionStatus[] = [
  "draft",
  "quotation",
  "confirmed",
  "active",
  "paused",
  "closed",
];

describe("Subscription Lifecycle Transitions (transitions.ts)", () => {
  it("returns true for every allowed move in the state machine matrix", () => {
    expect(canTransition("draft", "quotation")).toBe(true);

    expect(canTransition("quotation", "confirmed")).toBe(true);
    expect(canTransition("quotation", "draft")).toBe(true);

    expect(canTransition("confirmed", "active")).toBe(true);

    expect(canTransition("active", "paused")).toBe(true);
    expect(canTransition("active", "closed")).toBe(true);

    expect(canTransition("paused", "active")).toBe(true);
    expect(canTransition("paused", "closed")).toBe(true);
  });

  it("returns false for every other combination of the 6 statuses", () => {
    for (const from of ALL_STATUSES) {
      const allowedNext = ALLOWED_TRANSITIONS[from];
      for (const to of ALL_STATUSES) {
        if (!allowedNext.includes(to)) {
          expect(canTransition(from, to)).toBe(false);
        }
      }
    }
  });

  it("guarantees closed status has no further transitions", () => {
    expect(ALLOWED_TRANSITIONS.closed).toHaveLength(0);
    expect(getAllowedTransitions("closed")).toHaveLength(0);
    for (const to of ALL_STATUSES) {
      expect(canTransition("closed", to)).toBe(false);
    }
  });

  it("hides Pause when plan.pausable is false", () => {
    const activeWithPause = getAllowedTransitions("active", { pausable: true, closable: true });
    expect(activeWithPause).toContain("paused");

    const activeNoPause = getAllowedTransitions("active", { pausable: false, closable: true });
    expect(activeNoPause).not.toContain("paused");
    expect(activeNoPause).toContain("closed");
  });

  it("hides Close when plan.closable is false", () => {
    const activeWithClose = getAllowedTransitions("active", { pausable: true, closable: true });
    expect(activeWithClose).toContain("closed");

    const activeNoClose = getAllowedTransitions("active", { pausable: true, closable: false });
    expect(activeNoClose).not.toContain("closed");
    expect(activeNoClose).toContain("paused");

    const pausedNoClose = getAllowedTransitions("paused", { pausable: true, closable: false });
    expect(pausedNoClose).not.toContain("closed");
    expect(pausedNoClose).toContain("active");
  });
});
