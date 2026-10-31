"use client";

import React, { useState, useTransition } from "react";
import { TaxRule, Discount } from "@/types";
import { createTaxRuleAction, createDiscountAction, runRecurringBillingAction } from "@/app/actions/billing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Percent,
  Tag,
  RotateCw,
  Plus,
  X,
  Loader2,
} from "lucide-react";

interface BillingSettingsClientProps {
  initialTaxRules: TaxRule[];
  initialDiscounts: Discount[];
}

export function BillingSettingsClient({
  initialTaxRules,
  initialDiscounts,
}: BillingSettingsClientProps) {
  const [activeTab, setActiveTab] = useState<"taxes" | "discounts" | "recurring">("taxes");
  const [taxRules, setTaxRules] = useState<TaxRule[]>(initialTaxRules);
  const [discounts, setDiscounts] = useState<Discount[]>(initialDiscounts);

  // Modal states
  const [isTaxModalOpen, setIsTaxModalOpen] = useState(false);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);

  // New Tax Form state
  const [taxName, setTaxName] = useState("");
  const [taxCode, setTaxCode] = useState("");
  const [taxRate, setTaxRate] = useState<number>(18);
  const [taxDesc, setTaxDesc] = useState("");
  const [taxError, setTaxError] = useState<string | null>(null);
  const [isSubmittingTax, setIsSubmittingTax] = useState(false);

  // New Discount Form state
  const [discountCode, setDiscountCode] = useState("");
  const [discountName, setDiscountName] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [minPurchase, setMinPurchase] = useState<number>(0);
  const [maxUsage, setMaxUsage] = useState<number>(100);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [isSubmittingDiscount, setIsSubmittingDiscount] = useState(false);

  // Recurring billing trigger
  const [isPendingRecurring, startRecurringTransition] = useTransition();
  const [recurringNotice, setRecurringNotice] = useState<string | null>(null);

  const handleCreateTax = async (e: React.FormEvent) => {
    e.preventDefault();
    setTaxError(null);
    setIsSubmittingTax(true);
    try {
      const res = await createTaxRuleAction({
        name: taxName,
        code: taxCode,
        rate: taxRate,
        description: taxDesc || undefined,
        country: "IN",
      });
      if (!res.success || !res.data) {
        setTaxError(res.error || "Failed to create tax rule");
      } else {
        const created = res.data;
        setTaxRules((prev) => [created, ...prev]);
        setIsTaxModalOpen(false);
        setTaxName("");
        setTaxCode("");
        setTaxDesc("");
      }
    } catch (err: any) {
      setTaxError(err.message || "An error occurred");
    } finally {
      setIsSubmittingTax(false);
    }
  };

  const handleCreateDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDiscountError(null);
    setIsSubmittingDiscount(true);
    try {
      const res = await createDiscountAction({
        code: discountCode,
        name: discountName,
        type: discountType,
        value: discountValue,
        minPurchaseAmount: minPurchase || 0,
        minQuantity: 1,
        maxUsage: maxUsage || undefined,
      });
      if (!res.success || !res.data) {
        setDiscountError(res.error || "Failed to create discount");
      } else {
        const created = res.data;
        setDiscounts((prev) => [created, ...prev]);
        setIsDiscountModalOpen(false);
        setDiscountCode("");
        setDiscountName("");
      }
    } catch (err: any) {
      setDiscountError(err.message || "An error occurred");
    } finally {
      setIsSubmittingDiscount(false);
    }
  };

  const handleTriggerBilling = () => {
    setRecurringNotice(null);
    startRecurringTransition(async () => {
      const res = await runRecurringBillingAction();
      if (res.success && res.data) {
        setRecurringNotice(
          `Success: Processed ${res.data.processedCount} subscription(s), created ${res.data.invoicesCreated.length} invoice(s).`
        );
      } else {
        setRecurringNotice(`Error: ${res.error || "Failed to execute billing engine"}`);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Percent className="w-7 h-7 text-primary" />
          Billing, Tax & Discount Configuration
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure regional Indian GST tax rules, promotional coupons, discount parameters, and recurring cadence.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border space-x-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab("taxes")}
          className={`pb-3 flex items-center gap-2 transition-colors border-b-2 ${
            activeTab === "taxes"
              ? "border-primary text-primary font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Percent className="w-4 h-4" />
          Tax Rules ({taxRules.length})
        </button>
        <button
          onClick={() => setActiveTab("discounts")}
          className={`pb-3 flex items-center gap-2 transition-colors border-b-2 ${
            activeTab === "discounts"
              ? "border-primary text-primary font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Tag className="w-4 h-4" />
          Discounts & Vouchers ({discounts.length})
        </button>
        <button
          onClick={() => setActiveTab("recurring")}
          className={`pb-3 flex items-center gap-2 transition-colors border-b-2 ${
            activeTab === "recurring"
              ? "border-primary text-primary font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <RotateCw className="w-4 h-4" />
          Recurring Billing Engine
        </button>
      </div>

      {/* TAB 1: TAX RULES */}
      {activeTab === "taxes" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-lg">Configured Regional Tax Rules</h3>
              <p className="text-xs text-muted-foreground">
                Taxes are computed after discounts with mathematical rounding in integer paise.
              </p>
            </div>
            <Button onClick={() => setIsTaxModalOpen(true)} className="flex items-center gap-1.5 text-xs">
              <Plus className="w-4 h-4" />
              New Tax Rule
            </Button>
          </div>

          <Card className="border-border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="text-xs uppercase font-semibold">Tax Name</TableHead>
                  <TableHead className="text-xs uppercase font-semibold">Code</TableHead>
                  <TableHead className="text-xs uppercase font-semibold text-right">Rate (%)</TableHead>
                  <TableHead className="text-xs uppercase font-semibold">Country</TableHead>
                  <TableHead className="text-xs uppercase font-semibold">Description</TableHead>
                  <TableHead className="text-xs uppercase font-semibold text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {taxRules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium text-sm text-foreground">{rule.name}</TableCell>
                    <TableCell className="font-mono text-xs font-semibold text-primary">
                      {rule.code}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-sm">
                      {rule.rate.toFixed(2)}%
                    </TableCell>
                    <TableCell className="text-xs font-semibold uppercase">{rule.country}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                      {rule.description || "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                        Active
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* TAB 2: DISCOUNTS */}
      {activeTab === "discounts" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-lg">Discounts, Coupons & Subsidies</h3>
              <p className="text-xs text-muted-foreground">
                Rules apply to item subtotals based on minimum purchase and validity constraints.
              </p>
            </div>
            <Button onClick={() => setIsDiscountModalOpen(true)} className="flex items-center gap-1.5 text-xs">
              <Plus className="w-4 h-4" />
              New Discount Code
            </Button>
          </div>

          <Card className="border-border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="text-xs uppercase font-semibold">Coupon Code</TableHead>
                  <TableHead className="text-xs uppercase font-semibold">Name</TableHead>
                  <TableHead className="text-xs uppercase font-semibold">Type</TableHead>
                  <TableHead className="text-xs uppercase font-semibold text-right">Value</TableHead>
                  <TableHead className="text-xs uppercase font-semibold text-right">Min Order</TableHead>
                  <TableHead className="text-xs uppercase font-semibold text-center">Usage</TableHead>
                  <TableHead className="text-xs uppercase font-semibold text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {discounts.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-mono text-xs font-bold text-primary">
                      {d.code}
                    </TableCell>
                    <TableCell className="font-medium text-sm text-foreground">{d.name}</TableCell>
                    <TableCell className="text-xs uppercase font-medium text-muted-foreground">
                      {d.type}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold text-sm">
                      {d.type === "percentage" ? `${d.value}%` : `₹${d.value.toFixed(2)}`}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-muted-foreground">
                      {d.minPurchaseAmount ? `₹${d.minPurchaseAmount.toFixed(2)}` : "None"}
                    </TableCell>
                    <TableCell className="text-center font-mono text-xs">
                      {d.usedCount} / {d.maxUsage || "∞"}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                        Active
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* TAB 3: RECURRING BILLING ENGINE */}
      {activeTab === "recurring" && (
        <div className="space-y-6 max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <RotateCw className="w-5 h-5 text-primary" />
                Idempotent Recurring Billing Scheduler
              </CardTitle>
              <CardDescription>
                Brightloop continuously evaluates subscription billing dates. The engine guarantees atomic invoice
                generation and prevents duplicate billing cycles via unique period constraints.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recurringNotice && (
                <div className="p-3 bg-muted border rounded-lg text-sm text-foreground font-medium">
                  {recurringNotice}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm bg-muted/20 p-4 rounded-lg border">
                <div>
                  <span className="text-xs text-muted-foreground block">Cron API Route</span>
                  <code className="text-xs font-mono font-semibold">POST /api/billing</code>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Concurrency Guarantee</span>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    UNIQUE(subscription_id, period_start)
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  onClick={handleTriggerBilling}
                  disabled={isPendingRecurring}
                  className="w-full sm:w-auto"
                >
                  {isPendingRecurring ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Executing Billing Pass...
                    </>
                  ) : (
                    "Trigger Recurring Billing Pass Now"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* CREATE TAX MODAL */}
      {isTaxModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-background border border-border w-full max-w-md rounded-xl shadow-xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-semibold text-lg">Create New Tax Rule</h3>
              <button onClick={() => setIsTaxModalOpen(false)}>
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {taxError && (
              <div className="p-2.5 bg-destructive/15 text-destructive text-xs rounded-lg">{taxError}</div>
            )}

            <form onSubmit={handleCreateTax} className="space-y-3">
              <div>
                <label className="text-xs font-medium block mb-1">Tax Name</label>
                <Input
                  value={taxName}
                  onChange={(e) => setTaxName(e.target.value)}
                  placeholder="e.g. GST Standard 18%"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium block mb-1">Tax Code (Unique)</label>
                <Input
                  value={taxCode}
                  onChange={(e) => setTaxCode(e.target.value.toUpperCase())}
                  placeholder="e.g. GST_18"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium block mb-1">Rate (%)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium block mb-1">Description (Optional)</label>
                <Input
                  value={taxDesc}
                  onChange={(e) => setTaxDesc(e.target.value)}
                  placeholder="e.g. Applicable on SaaS software in India"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button type="button" variant="outline" onClick={() => setIsTaxModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmittingTax}>
                  {isSubmittingTax ? "Creating..." : "Save Tax Rule"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE DISCOUNT MODAL */}
      {isDiscountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-background border border-border w-full max-w-md rounded-xl shadow-xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-semibold text-lg">Create Discount Voucher</h3>
              <button onClick={() => setIsDiscountModalOpen(false)}>
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {discountError && (
              <div className="p-2.5 bg-destructive/15 text-destructive text-xs rounded-lg">
                {discountError}
              </div>
            )}

            <form onSubmit={handleCreateDiscount} className="space-y-3">
              <div>
                <label className="text-xs font-medium block mb-1">Coupon Code (e.g. FLASH25)</label>
                <Input
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                  placeholder="e.g. FLASH25"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium block mb-1">Discount Name</label>
                <Input
                  value={discountName}
                  onChange={(e) => setDiscountName(e.target.value)}
                  placeholder="e.g. Flash Sale 25% Off"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium block mb-1">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed INR (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1">
                    Value {discountType === "percentage" ? "(%)" : "(₹)"}
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium block mb-1">Min Purchase (₹)</label>
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    value={minPurchase}
                    onChange={(e) => setMinPurchase(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1">Max Redemptions</label>
                  <Input
                    type="number"
                    step="1"
                    min="1"
                    value={maxUsage}
                    onChange={(e) => setMaxUsage(parseInt(e.target.value, 10) || 1)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button type="button" variant="outline" onClick={() => setIsDiscountModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmittingDiscount}>
                  {isSubmittingDiscount ? "Saving..." : "Create Discount"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
