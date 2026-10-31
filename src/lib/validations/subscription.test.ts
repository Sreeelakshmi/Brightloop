import { describe, expect, it } from "vitest";

import {
  planSchema,
  productSchema,
  productVariantSchema,
  quotationTemplateSchema,
  subscriptionCreateSchema,
  subscriptionLineSchema,
  subscriptionSchema,
} from "@/lib/validations/subscription";

/* -------------------------------------------------------------------------- */
/* Fixtures: one fully valid object per schema                                */
/* -------------------------------------------------------------------------- */

const validLine = {
  productId: "prod_1",
  variantId: "var_1",
  quantity: 2,
  unitPrice: 49.99,
  taxId: "tax_1",
  amount: 99.98,
};

const validProduct = {
  name: "Business Router",
  type: "goods",
  salesPrice: 149.99,
  costPrice: 89.5,
  notes: "Includes a 2-year warranty",
};

const validVariant = {
  productId: "prod_1",
  attribute: "Colour",
  value: "Black",
  extraPrice: 10,
};

const validPlan = {
  name: "Pro Monthly",
  price: 99,
  billingPeriod: "monthly",
  minQuantity: 1,
  availableFrom: "2026-01-01",
  availableTo: "2026-12-31",
  autoClose: false,
  closable: true,
  pausable: true,
  renewable: true,
};

const validTemplate = {
  name: "Standard Proposal",
  planId: "plan_1",
  validityDays: 30,
  lines: [validLine],
};

const validCreateSubscription = {
  customerId: "cust_1",
  planId: "plan_1",
  startDate: "2026-01-01",
  expiryDate: "2027-01-01",
  paymentTerms: "net_30",
  lines: [validLine],
};

const validSubscription = {
  number: "SUB-2026-0001",
  customerId: "cust_1",
  planId: "plan_1",
  startDate: "2026-01-01",
  expiryDate: "2027-01-01",
  paymentTerms: "net_30",
  status: "active",
  nextBillingDate: "2026-02-01",
  lines: [validLine],
};

/**
 * Asserts the parse failed and that at least one issue is reported against
 * `path`, so a failure for an unrelated reason does not silently pass the test.
 */
type SafeParseLike = {
  success: boolean;
  error?: { issues: { path: PropertyKey[] }[] };
};

function expectInvalid(result: SafeParseLike, path: string) {
  expect(result.success).toBe(false);
  expect(
    (result.error?.issues ?? []).map((issue) => issue.path.map(String).join(".")),
  ).toContain(path);
}

/* -------------------------------------------------------------------------- */
/* Product                                                                    */
/* -------------------------------------------------------------------------- */

describe("productSchema", () => {
  it("accepts a fully valid product", () => {
    expect(productSchema.safeParse(validProduct).success).toBe(true);
  });

  it("rejects a negative salesPrice", () => {
    expectInvalid(
      productSchema.safeParse({ ...validProduct, salesPrice: -1 }),
      "salesPrice",
    );
  });

  it("rejects a negative costPrice", () => {
    expectInvalid(
      productSchema.safeParse({ ...validProduct, costPrice: -0.01 }),
      "costPrice",
    );
  });

  it("rejects an empty name", () => {
    expectInvalid(
      productSchema.safeParse({ ...validProduct, name: "   " }),
      "name",
    );
  });
});

/* -------------------------------------------------------------------------- */
/* Product variant                                                            */
/* -------------------------------------------------------------------------- */

describe("productVariantSchema", () => {
  it("accepts a fully valid variant", () => {
    expect(productVariantSchema.safeParse(validVariant).success).toBe(true);
  });

  it("rejects a negative extraPrice", () => {
    expectInvalid(
      productVariantSchema.safeParse({ ...validVariant, extraPrice: -5 }),
      "extraPrice",
    );
  });

  it("rejects an empty attribute", () => {
    expectInvalid(
      productVariantSchema.safeParse({ ...validVariant, attribute: "  " }),
      "attribute",
    );
  });

  it("rejects an empty value", () => {
    expectInvalid(
      productVariantSchema.safeParse({ ...validVariant, value: "" }),
      "value",
    );
  });
});

/* -------------------------------------------------------------------------- */
/* Plan                                                                       */
/* -------------------------------------------------------------------------- */

describe("planSchema", () => {
  it("accepts a fully valid plan", () => {
    expect(planSchema.safeParse(validPlan).success).toBe(true);
  });

  it.each(["daily", "weekly", "monthly", "yearly"])(
    "accepts the billingPeriod %s",
    (billingPeriod) => {
      expect(planSchema.safeParse({ ...validPlan, billingPeriod }).success).toBe(
        true,
      );
    },
  );

  it("rejects an unsupported billingPeriod", () => {
    expectInvalid(
      planSchema.safeParse({ ...validPlan, billingPeriod: "quarterly" }),
      "billingPeriod",
    );
  });

  it("rejects a negative price", () => {
    expectInvalid(planSchema.safeParse({ ...validPlan, price: -0.01 }), "price");
  });

  it("rejects an empty name", () => {
    expectInvalid(planSchema.safeParse({ ...validPlan, name: "" }), "name");
  });

  it("rejects a minQuantity of 0", () => {
    expectInvalid(
      planSchema.safeParse({ ...validPlan, minQuantity: 0 }),
      "minQuantity",
    );
  });

  it("rejects availableTo before availableFrom", () => {
    expectInvalid(
      planSchema.safeParse({
        ...validPlan,
        availableFrom: "2026-06-01",
        availableTo: "2026-01-01",
      }),
      "availableTo",
    );
  });
});

/* -------------------------------------------------------------------------- */
/* Subscription line                                                          */
/* -------------------------------------------------------------------------- */

describe("subscriptionLineSchema", () => {
  it("accepts a fully valid line", () => {
    expect(subscriptionLineSchema.safeParse(validLine).success).toBe(true);
  });

  it("rejects a quantity of 0", () => {
    expectInvalid(
      subscriptionLineSchema.safeParse({ ...validLine, quantity: 0 }),
      "quantity",
    );
  });

  it("rejects a negative unitPrice", () => {
    expectInvalid(
      subscriptionLineSchema.safeParse({ ...validLine, unitPrice: -10 }),
      "unitPrice",
    );
  });

  it("rejects a negative amount", () => {
    expectInvalid(
      subscriptionLineSchema.safeParse({ ...validLine, amount: -99.98 }),
      "amount",
    );
  });
});

/* -------------------------------------------------------------------------- */
/* Quotation template                                                         */
/* -------------------------------------------------------------------------- */

describe("quotationTemplateSchema", () => {
  it("accepts a fully valid quotation template", () => {
    expect(quotationTemplateSchema.safeParse(validTemplate).success).toBe(true);
  });

  it("rejects an empty name", () => {
    expectInvalid(
      quotationTemplateSchema.safeParse({ ...validTemplate, name: "  " }),
      "name",
    );
  });

  it("rejects a validityDays of 0", () => {
    expectInvalid(
      quotationTemplateSchema.safeParse({ ...validTemplate, validityDays: 0 }),
      "validityDays",
    );
  });
});

/* -------------------------------------------------------------------------- */
/* Subscription                                                               */
/* -------------------------------------------------------------------------- */

describe("subscriptionSchema", () => {
  it("accepts a fully valid subscription", () => {
    expect(subscriptionSchema.safeParse(validSubscription).success).toBe(true);
  });

  it.each(["draft", "quotation", "confirmed", "active", "paused", "closed"])(
    "accepts the status %s",
    (status) => {
      expect(
        subscriptionSchema.safeParse({ ...validSubscription, status }).success,
      ).toBe(true);
    },
  );

  it("rejects an unknown status", () => {
    expectInvalid(
      subscriptionSchema.safeParse({ ...validSubscription, status: "trialing" }),
      "status",
    );
  });

  it("rejects an expiryDate before startDate", () => {
    expectInvalid(
      subscriptionSchema.safeParse({
        ...validSubscription,
        startDate: "2026-06-01",
        expiryDate: "2026-01-01",
      }),
      "expiryDate",
    );
  });

  it("rejects an empty number", () => {
    expectInvalid(
      subscriptionSchema.safeParse({ ...validSubscription, number: " " }),
      "number",
    );
  });
});

/* -------------------------------------------------------------------------- */
/* Subscription create payload                                                */
/* -------------------------------------------------------------------------- */

describe("subscriptionCreateSchema", () => {
  it("accepts an object with no number", () => {
    expect(
      subscriptionCreateSchema.safeParse(validCreateSubscription).success,
    ).toBe(true);
  });
});
