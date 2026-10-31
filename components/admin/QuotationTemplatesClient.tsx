"use client";

import * as React from "react";
import { QuotationTemplate, Customer, Plan, Product } from "@/types";
import { PageHeader, ConfirmDialog } from "@/components/ui-shared";
import { formatMoney } from "@/lib/formatters";
import { Copy, Plus, ArrowRight, Layers, FileCheck, CheckCircle2 } from "lucide-react";
import { handleCreateQuotationFromTemplate } from "@/app/actions/billing-actions";
import { useRouter } from "next/navigation";

interface QuotationTemplatesClientProps {
  initialTemplates: QuotationTemplate[];
  customers: Customer[];
  plans: Plan[];
  products: Product[];
  isAdmin: boolean;
}

export function QuotationTemplatesClient({
  initialTemplates,
  customers,
  plans,
  products,
  isAdmin,
}: QuotationTemplatesClientProps) {
  const router = useRouter();
  const [templates, setTemplates] = React.useState<QuotationTemplate[]>(initialTemplates);
  const [selectedTemplate, setSelectedTemplate] = React.useState<QuotationTemplate | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = React.useState<string>(customers[0]?.id || "");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  const handleApplyTemplate = async () => {
    if (!selectedTemplate || !selectedCustomerId) return;
    setError(null);
    setLoading(true);

    const res = await handleCreateQuotationFromTemplate(selectedTemplate.id, selectedCustomerId);
    setLoading(false);

    if (res.success && res.subscription) {
      setSuccessMsg(`Quotation ${res.subscription.subscriptionNumber} created successfully!`);
      setSelectedTemplate(null);
      setTimeout(() => {
        router.push(`/subscriptions/${res.subscription?.id}`);
      }, 1200);
    } else {
      setError(res.error || "Failed to create quotation from template");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader
          title="QUOTATION TEMPLATES"
          subtitle="Pre-configured Contract Blueprints & Fast Quotation Provisioning"
          logDate="31.10.2026"
        />
      </div>

      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-800 p-3 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono">
        {templates.map((tmpl) => {
          const linkedPlan = plans.find((p) => p.id === tmpl.planId);
          return (
            <div
              key={tmpl.id}
              className="bg-white border border-[#CBD5CB] p-5 flex flex-col justify-between space-y-4 hover:border-[#2B302B] transition-colors"
            >
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-[#E4EEE4] text-[#2B302B]">
                    {tmpl.validityDays} Days Validity
                  </span>
                  <Copy className="w-4 h-4 text-[#8A968A]" />
                </div>

                <h3 className="font-bold text-sm text-[#2B302B]">{tmpl.name}</h3>
                <div className="text-[11px] text-[#8A968A] mt-1">
                  Plan: <strong className="text-[#2B302B]">{linkedPlan?.name || tmpl.planId}</strong>
                </div>

                {/* Line Items Preview */}
                <div className="mt-4 pt-3 border-t border-[#E4EEE4] space-y-2">
                  <div className="text-[10px] uppercase text-[#8A968A] font-semibold">
                    Pre-filled Order Lines:
                  </div>
                  <div className="space-y-1.5">
                    {tmpl.lines.map((l, i) => {
                      const prod = products.find((p) => p.id === l.productId);
                      const variant = prod?.variants?.find((v) => v.id === l.variantId);
                      return (
                        <div
                          key={i}
                          className="bg-[#F8FAF8] border border-[#CBD5CB]/50 p-2 text-[11px] flex justify-between items-center"
                        >
                          <div>
                            <div className="font-medium text-[#2B302B]">
                              {prod?.name || l.productId}
                            </div>
                            <div className="text-[10px] text-[#8A968A]">
                              Qty: {l.quantity} {variant ? `• ${variant.attributeValue}` : ""}
                            </div>
                          </div>
                          <div className="font-bold text-[#2B302B]">
                            {formatMoney(l.unitPrice * l.quantity)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E4EEE4]">
                <button
                  onClick={() => {
                    setSelectedTemplate(tmpl);
                    setError(null);
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-[#2B302B] hover:bg-black text-[#E4EEE4] py-2 text-xs font-mono uppercase tracking-wider transition-colors"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  Use Template
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 1-Click Quotation Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#2B302B] w-full max-w-md p-6 space-y-4 font-mono shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#CBD5CB] pb-3">
              <h3 className="font-semibold text-sm text-[#2B302B] uppercase tracking-wider">
                Create Quotation From Template
              </h3>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="text-[#8A968A] hover:text-[#2B302B]"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-2.5 text-xs">
                {error}
              </div>
            )}

            <div className="text-xs space-y-3">
              <div className="bg-[#F8FAF8] p-3 border border-[#CBD5CB]">
                <div className="text-[10px] uppercase text-[#8A968A]">Selected Template</div>
                <div className="font-bold text-[#2B302B] text-sm mt-0.5">
                  {selectedTemplate.name}
                </div>
                <div className="text-[11px] text-[#8A968A] mt-1">
                  Validity: {selectedTemplate.validityDays} days from generation
                </div>
              </div>

              <div>
                <label className="block text-[#8A968A] uppercase mb-1">
                  Assign To Customer *
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full border border-[#CBD5CB] p-2 bg-white text-[#2B302B] focus:border-[#F57B4A] focus:outline-none"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.company})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#CBD5CB] text-xs">
              <button
                type="button"
                onClick={() => setSelectedTemplate(null)}
                className="px-4 py-2 border border-[#CBD5CB] text-[#2B302B] hover:bg-[#F4F7F4]"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyTemplate}
                disabled={loading}
                className="px-4 py-2 bg-[#2B302B] hover:bg-black text-[#E4EEE4] disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? "Generating..." : "Generate Quotation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
