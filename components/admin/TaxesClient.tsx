"use client";

import * as React from "react";
import { TaxRule } from "@/types";
import { PageHeader } from "@/components/ui-shared";
import { Plus, Receipt, CheckCircle2, AlertTriangle } from "lucide-react";
import { handleCreateTaxRule } from "@/app/actions/billing-actions";

interface TaxesClientProps {
  initialTaxes: TaxRule[];
  isAdmin: boolean;
}

export function TaxesClient({ initialTaxes, isAdmin }: TaxesClientProps) {
  const [taxes, setTaxes] = React.useState<TaxRule[]>(initialTaxes);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [type, setType] = React.useState<"percentage" | "fixed">("percentage");
  const [rate, setRate] = React.useState("18");
  const [isInclusive, setIsInclusive] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const res = await handleCreateTaxRule({
      name,
      type,
      rate: Number(rate),
      isInclusive,
      applicableProducts: ["all"],
    });

    setLoading(false);
    if (res.success && res.tax) {
      setTaxes([res.tax, ...taxes]);
      setIsModalOpen(false);
      setName("");
    } else {
      setErrorMsg(res.error || "Failed to create tax rule");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-mono">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader
          title="TAX RULES & TARIFFS"
          subtitle="Statutory GST, Cesses & Automated Line Item Tariffs"
          logDate="31.10.2026"
        />
        {isAdmin && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-[#2B302B] hover:bg-black text-[#E4EEE4] px-4 py-2 text-xs font-mono tracking-wider uppercase border border-[#2B302B] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Tax Rule
          </button>
        )}
      </div>

      {/* Taxes Table */}
      <div className="bg-white border border-[#CBD5CB] overflow-hidden">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-[#E4EEE4] border-b border-[#CBD5CB] text-[#2B302B] uppercase">
            <tr>
              <th className="p-3">Rule Name</th>
              <th className="p-3">Rate / Tariff</th>
              <th className="p-3">Type</th>
              <th className="p-3">Calculation</th>
              <th className="p-3">Applicability</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E4EEE4]">
            {taxes.map((t) => (
              <tr key={t.id} className="hover:bg-[#F8FAF8] transition-colors">
                <td className="p-3 font-bold text-[#2B302B]">{t.name}</td>
                <td className="p-3 font-semibold text-[#2B302B]">
                  {t.type === "percentage" ? `${t.rate}%` : `₹${t.rate} Flat`}
                </td>
                <td className="p-3 uppercase">{t.type}</td>
                <td className="p-3 text-[#8A968A]">
                  {t.isInclusive ? "Price-Inclusive" : "Price-Exclusive (Added on subtotal)"}
                </td>
                <td className="p-3 text-[#2B302B]">
                  {t.applicableProducts.includes("all") ? (
                    <span className="bg-[#E4EEE4] px-2 py-0.5 text-[10px] uppercase font-semibold">
                      All Products
                    </span>
                  ) : (
                    <span>{t.applicableProducts.length} Specific Products</span>
                  )}
                </td>
                <td className="p-3">
                  <span className="text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 text-[10px] uppercase font-bold">
                    Active
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Tax Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#2B302B] w-full max-w-md p-6 space-y-4 font-mono shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#CBD5CB] pb-3">
              <h3 className="font-semibold text-sm text-[#2B302B] uppercase tracking-wider">
                Create Tax Rule
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#8A968A] hover:text-[#2B302B]"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-2 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#8A968A] uppercase mb-1">Rule Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. IT Services Cess 2%"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-[#CBD5CB] p-2 text-[#2B302B] focus:border-[#F57B4A] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#8A968A] uppercase mb-1">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as "percentage" | "fixed")}
                    className="w-full border border-[#CBD5CB] p-2 bg-white text-[#2B302B] focus:border-[#F57B4A] focus:outline-none"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Flat (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#8A968A] uppercase mb-1">Rate Value *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    className="w-full border border-[#CBD5CB] p-2 text-[#2B302B] focus:border-[#F57B4A] focus:outline-none"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isInclusive}
                  onChange={(e) => setIsInclusive(e.target.checked)}
                  className="accent-[#2B302B]"
                />
                <span className="text-[#2B302B]">Tax is inclusive in base sales price</span>
              </label>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#CBD5CB]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-[#CBD5CB] text-[#2B302B] hover:bg-[#F4F7F4]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-[#2B302B] hover:bg-black text-[#E4EEE4] disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Save Rule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
