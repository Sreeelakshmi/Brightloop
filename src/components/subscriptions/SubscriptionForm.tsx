"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { THEME } from "./theme";
import {
  createSubscriptionDraftAction,
  createSubscriptionFromTemplateAction,
} from "@/app/(dashboard)/subscriptions/actions";
import type { QuotationTemplateWithDetails } from "@/types/subscription-services";
import type { PlanWithId, ProductWithVariants } from "@/types/catalog";
import type { PaymentTerms } from "@/types";

interface SubscriptionFormProps {
  templates: QuotationTemplateWithDetails[];
  plans: PlanWithId[];
  products: ProductWithVariants[];
  defaultCustomerId?: string;
}

export function SubscriptionForm({ templates, plans, products, defaultCustomerId = "00000000-0000-0000-0000-000000000002" }: SubscriptionFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"template" | "blank">("template");
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [customerId, setCustomerId] = useState(defaultCustomerId);
  const [planId, setPlanId] = useState(plans[0]?.id ?? "");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [expiryDate, setExpiryDate] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]
  );
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerms>("immediate");
  const [lines, setLines] = useState([
    { productId: products[0]?.id ?? "", variantId: undefined as string | undefined, quantity: 1, unitPrice: products[0]?.salesPrice ?? 0 },
  ]);

  const addLine = () => {
    const p = products[0];
    setLines([...lines, { productId: p?.id ?? "", variantId: undefined, quantity: 1, unitPrice: p?.salesPrice ?? 0 }]);
  };

  const updateLine = (idx: number, field: string, val: any) => {
    setLines(lines.map((l, i) => {
      if (i !== idx) return l;
      if (field === "productId") {
        const prod = products.find((item) => item.id === val);
        return { ...l, productId: val, variantId: undefined, unitPrice: prod?.salesPrice ?? 0 };
      }
      return { ...l, [field]: val };
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === "template") {
        const res = await createSubscriptionFromTemplateAction({
          templateId,
          customerId,
          startDate,
          expiryDate,
          paymentTerms,
        });
        if (!res.success) { setError(res.error ?? "Failed to create subscription."); return; }
        router.push(`/subscriptions/${res.data?.id}`);
      } else {
        const res = await createSubscriptionDraftAction({
          customerId,
          planId,
          startDate,
          expiryDate,
          paymentTerms,
          lines: lines.map((l) => ({ ...l, amount: Math.round(l.quantity * l.unitPrice * 100) / 100 })),
        });
        if (!res.success) { setError(res.error ?? "Failed to create subscription."); return; }
        router.push(`/subscriptions/${res.data?.id}`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error creating contract.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`p-6 max-w-3xl mx-auto ${THEME.card}`}>
      <h2 className={`text-xl mb-4 ${THEME.primaryDark.heading}`}>New Subscription Contract</h2>
      {error && <div className="p-3 mb-4 rounded-lg bg-[#FDEEE7] text-[#D95522] text-sm border border-[#F27B4B]">{error}</div>}

      <div className="flex gap-2 mb-4 p-1 rounded-lg bg-[#DDE5DB]">
        <button type="button" onClick={() => setMode("template")} className={`flex-1 py-1.5 text-xs font-bold uppercase rounded-md transition-all ${mode === "template" ? "bg-white text-[#1F2622] shadow-sm" : "text-[#657367]"}`}>
          From Proposal Template
        </button>
        <button type="button" onClick={() => setMode("blank")} className={`flex-1 py-1.5 text-xs font-bold uppercase rounded-md transition-all ${mode === "blank" ? "bg-white text-[#1F2622] shadow-sm" : "text-[#657367]"}`}>
          Custom Blank Contract
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "template" ? (
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#657367]">Select Proposal Template</label>
            <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} className={`w-full mt-1 ${THEME.input}`} required>
              {templates.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.plan?.name ?? "Plan"})</option>)}
            </select>
          </div>
        ) : (
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#657367]">Subscription Plan</label>
            <select value={planId} onChange={(e) => setPlanId(e.target.value)} className={`w-full mt-1 ${THEME.input}`} required>
              {plans.map((p) => <option key={p.id} value={p.id}>{p.name} (${p.price}/{p.billingPeriod})</option>)}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#657367]">Customer UUID</label>
            <input value={customerId} onChange={(e) => setCustomerId(e.target.value)} className={`w-full mt-1 font-mono text-xs ${THEME.input}`} required />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#657367]">Start Date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={`w-full mt-1 ${THEME.input}`} required />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#657367]">Expiry Date</label>
            <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className={`w-full mt-1 ${THEME.input}`} required />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-[#657367]">Payment Terms</label>
          <select value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value as PaymentTerms)} className={`w-full mt-1 ${THEME.input}`}>
            <option value="immediate">Immediate</option>
            <option value="net_15">Net 15</option>
            <option value="net_30">Net 30</option>
            <option value="net_60">Net 60</option>
          </select>
        </div>

        {mode === "blank" && (
          <div className="pt-2">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#657367]">Contract Line Items</span>
              <button type="button" onClick={addLine} className={`text-xs px-2.5 py-1 ${THEME.secondaryButton} inline-flex items-center gap-1`}>
                <Plus className="w-3.5 h-3.5" /> Add Line
              </button>
            </div>
            <div className="space-y-2">
              {lines.map((l, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <select className={`flex-1 ${THEME.input}`} value={l.productId} onChange={(e) => updateLine(idx, "productId", e.target.value)}>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name} (${p.salesPrice})</option>)}
                  </select>
                  <input type="number" min="1" className={`w-20 ${THEME.input}`} value={l.quantity} onChange={(e) => updateLine(idx, "quantity", Number(e.target.value))} />
                  <input type="number" step="0.01" className={`w-24 ${THEME.input}`} value={l.unitPrice} onChange={(e) => updateLine(idx, "unitPrice", Number(e.target.value))} />
                  <button type="button" onClick={() => setLines(lines.filter((_, i) => i !== idx))} className="p-2 text-[#657367] hover:text-[#F27B4B]" disabled={lines.length <= 1}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t border-[#D5DDD2]">
          <button type="button" onClick={() => router.back()} className={`px-4 py-2 ${THEME.secondaryButton}`}>Cancel</button>
          <button type="submit" disabled={loading} className={`px-5 py-2 ${THEME.primaryDark.button}`}>{loading ? "Creating..." : "Create Subscription"}</button>
        </div>
      </form>
    </div>
  );
}
