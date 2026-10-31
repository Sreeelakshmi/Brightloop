"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { THEME } from "./theme";
import { createTemplateAction, updateTemplateAction } from "@/app/(dashboard)/quotations/actions";
import type { QuotationTemplateWithDetails } from "@/types/subscription-services";
import type { PlanWithId, ProductWithVariants } from "@/types/catalog";

interface TemplateFormProps {
  initialTemplate?: QuotationTemplateWithDetails | null;
  plans: PlanWithId[];
  products: ProductWithVariants[];
}

export function TemplateForm({ initialTemplate, plans, products }: TemplateFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(initialTemplate?.name ?? "");
  const [planId, setPlanId] = useState(initialTemplate?.planId ?? plans[0]?.id ?? "");
  const [validityDays, setValidityDays] = useState(initialTemplate?.validityDays ?? 30);
  const [lines, setLines] = useState(
    initialTemplate?.lines?.map((l) => ({
      productId: l.productId,
      variantId: l.variantId,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
    })) ?? [
      {
        productId: products[0]?.id ?? "",
        variantId: undefined as string | undefined,
        quantity: 1,
        unitPrice: products[0]?.salesPrice ?? 0,
      },
    ]
  );

  const addLine = () => {
    const firstProd = products[0];
    setLines([...lines, { productId: firstProd?.id ?? "", variantId: undefined, quantity: 1, unitPrice: firstProd?.salesPrice ?? 0 }]);
  };

  const removeLine = (idx: number) => {
    if (lines.length <= 1) return;
    setLines(lines.filter((_, i) => i !== idx));
  };

  const updateLine = (idx: number, field: string, val: any) => {
    setLines(lines.map((l, i) => {
      if (i !== idx) return l;
      if (field === "productId") {
        const prod = products.find((p) => p.id === val);
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
      const payload = {
        name,
        planId,
        validityDays: Number(validityDays),
        lines: lines.map((l) => ({ ...l, amount: Math.round(l.quantity * l.unitPrice * 100) / 100 })),
      };
      const res = initialTemplate
        ? await updateTemplateAction(initialTemplate.id, payload)
        : await createTemplateAction(payload);

      if (!res.success) {
        setError(res.error ?? "Failed to save template.");
        return;
      }
      router.push("/quotations");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error saving template");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`p-6 max-w-3xl mx-auto ${THEME.card}`}>
      <h2 className={`text-xl mb-4 ${THEME.primaryDark.heading}`}>
        {initialTemplate ? "Edit Proposal Template" : "New Proposal Template"}
      </h2>
      {error && <div className="p-3 mb-4 rounded-lg bg-[#FDEEE7] text-[#D95522] text-sm border border-[#F27B4B]">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-[#657367]">Template Name</label>
          <input className={`w-full mt-1 ${THEME.input}`} value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#657367]">Target Plan</label>
            <select className={`w-full mt-1 ${THEME.input}`} value={planId} onChange={(e) => setPlanId(e.target.value)}>
              {plans.map((p) => <option key={p.id} value={p.id}>{p.name} (${p.price}/{p.billingPeriod})</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#657367]">Validity (Days)</label>
            <input type="number" min="1" className={`w-full mt-1 ${THEME.input}`} value={validityDays} onChange={(e) => setValidityDays(Number(e.target.value))} required />
          </div>
        </div>
        <div className="pt-2">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#657367]">Default Line Items</span>
            <button type="button" onClick={addLine} className={`text-xs px-2.5 py-1 ${THEME.secondaryButton} inline-flex items-center gap-1`}>
              <Plus className="w-3.5 h-3.5" /> Add Item
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
                <button type="button" onClick={() => removeLine(idx)} className="p-2 text-[#657367] hover:text-[#F27B4B]" disabled={lines.length <= 1}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t border-[#D5DDD2]">
          <button type="button" onClick={() => router.back()} className={`px-4 py-2 ${THEME.secondaryButton}`}>Cancel</button>
          <button type="submit" disabled={loading} className={`px-5 py-2 ${THEME.primaryDark.button}`}>{loading ? "Saving..." : "Save Template"}</button>
        </div>
      </form>
    </div>
  );
}
