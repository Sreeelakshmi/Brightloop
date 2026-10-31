import React from "react";
import { getTaxRules } from "@/services/taxes";
import { getDiscounts } from "@/services/discounts";
import { BillingSettingsClient } from "@/components/billing/billing-settings-client";

export const metadata = {
  title: "Billing & Tax Settings | Brightloop",
  description: "Configure regional tax rules, discount coupons, and recurring billing parameters.",
};

export default async function BillingSettingsPage() {
  const [taxRules, discounts] = await Promise.all([
    getTaxRules(),
    getDiscounts(),
  ]);

  return (
    <BillingSettingsClient
      initialTaxRules={taxRules}
      initialDiscounts={discounts}
    />
  );
}

