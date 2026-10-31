import { describe, expect, it } from "vitest";
import {
  calculateLine,
  calculateSubscriptionTotal,
} from "./pricing";

describe("Subscription Pricing & Line Arithmetic (pricing.ts)", () => {
  it("calculates line item without variant extra", () => {
    // 49.99 * 2 = 99.98
    expect(calculateLine(49.99, 0, 2)).toBe(99.98);
  });

  it("calculates line item including variant extra", () => {
    // (100 + 15.5) * 3 = 115.5 * 3 = 346.5
    expect(calculateLine(100, 15.5, 3)).toBe(346.5);
  });

  it("safely rounds floats to exactly two decimal places", () => {
    // 33.333 * 3 = 99.999 -> 100
    expect(calculateLine(33.333, 0, 3)).toBe(100);
    // 10.555 + 2.111 = 12.666 -> 12.67
    expect(calculateLine(10.555, 2.111, 1)).toBe(12.67);
  });

  it("calculates grand total for multiple lines", () => {
    const lines = [
      { unitPrice: 50, variantExtra: 10, quantity: 2 }, // 120
      { unitPrice: 25.5, variantExtra: 0, quantity: 4 }, // 102
      { unitPrice: 9.99, variantExtra: 0.01, quantity: 10 }, // 100
    ];
    expect(calculateSubscriptionTotal(lines)).toBe(322);
  });

  it("handles empty lines array and defaults cleanly", () => {
    expect(calculateSubscriptionTotal([])).toBe(0);
    expect(calculateSubscriptionTotal()).toBe(0);
  });

  it("handles negative inputs by clamping to 0", () => {
    expect(calculateLine(-50, -10, 2)).toBe(0);
    expect(calculateLine(50, 0, -2)).toBe(0);
  });
});
