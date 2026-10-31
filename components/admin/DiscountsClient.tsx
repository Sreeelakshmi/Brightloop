"use client";

import * as React from "react";
import { DiscountRule } from "@/types";
import { PageHeader } from "@/components/ui-shared";
import { Plus, Percent, CheckCircle2, AlertTriangle } from "lucide-react";
import { handleCreateDiscountRule } from "@/app/actions/billing-actions";
import { isDiscountExpired, isDiscountLimitReached } from "@/lib/business-rules";

interface DiscountsClientProps {
  initialDiscounts: DiscountRule[];
  isAdmin: boolean;
}

export function DiscountsClient({ initialDiscounts, isAdmin }: DiscountsClientProps) {
  const [discounts, setDiscounts] = React.useState<DiscountRule[]>(initialDiscounts);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [name, setName] = React.useState("");
  const [type, setType] = React.useState<"percentage" | "fixed">("percentage");
  const [value, setValue] = React.useState("10");
  const [minPurchaseAmount, setMinPurchaseAmount] = React.useState("5000");
  const [startDate, setStartDate] = React.useState("2026-01-01");
  const [endDate, setEndDate] = React.useState("2026-12-31");
  const [usageLimit, setUsageLimit] = React.useState("100");
  const [scope, setScope] = React.useState<"subscription" | "product">("subscription");
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const res = await handleCreateDiscountRule({
      code,
      name,
      type,
      value: Number(value),
      minPurchaseAmount: minPurchaseAmount ? Number(minPurchaseAmount) : undefined,
      startDate,
      endDate,
      usageLimit: usageLimit ? Number(usageLimit) : undefined,
      scope,
    });

    setLoading(false);
    if (res.success && res.discount) {
      setDiscounts([res.discount, ...discounts]);
      setIsModalOpen(false);
      setCode("");
      setName("");
    } else {
      setErrorMsg(res.error || "Failed to create discount rule");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-mono">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader
          title="DISCOUNT RULES & PROMOTIONS"
          subtitle="Tier Deductions, Usage Limits & Expiration Windows"
          logDate="31.10.2026"
        />
        {isAdmin && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-[#2B302B] hover:bg-black text-[#E4EEE4] px-4 py-2 text-xs font-mono tracking-wider uppercase border border-[#2B302B] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Discount Rule
          </button>
        )}
      </div>

      {/* Discounts Table */}
      <div className="bg-white border border-[#CBD5CB] overflow-hidden">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-[#E4EEE4] border-b border-[#CBD5CB] text-[#2B302B] uppercase">
            <tr>
              <th className="p-3">Coupon Code</th>
              <th className="p-3">Rule Name</th>
              <th className="p-3">Deduction Value</th>
              <th className="p-3">Validity Window</th>
              <th className="p-3">Usage Tracker</th>
              <th className="p-3">Status Badges</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E4EEE4]">
            {discounts.map((d) => {
              const expired = isDiscountExpired(d, today);
              const limitReached = isDiscountLimitReached(d);

              return (
                <tr key={d.id} className="hover:bg-[#F8FAF8] transition-colors">
                  <td className="p-3 font-bold text-[#2B302B]">
                    <span className="bg-[#E4EEE4] px-2 py-0.5 border border-[#CBD5CB] uppercase">
                      {d.code}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="font-semibold text-[#2B302B]">{d.name}</div>
                    <div className="text-[10px] text-[#8A968A] uppercase">Scope: {d.scope}</div>
                  </td>
                  <td className="p-3 font-bold text-[#2B302B]">
                    {d.type === "percentage" ? `${d.value}% Off` : `₹${d.value.toLocaleString("en-IN")} Flat`}
                  </td>
                  <td className="p-3 text-[#2B302B]">
                    {d.startDate} &rarr; {d.endDate}
                  </td>
                  <td className="p-3">
                    <div className="font-semibold text-[#2B302B]">
                      {d.usageCount} {d.usageLimit ? `/ ${d.usageLimit}` : "uses (unlimited)"}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {expired && (
                        <span className="text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 text-[10px] uppercase font-bold">
                          Expired
                        </span>
                      )}
                      {limitReached && (
                        <span className="text-[#F57B4A] bg-[#FFF4EE] border border-[#F57B4A] px-2 py-0.5 text-[10px] uppercase font-bold">
                          Limit Reached
                        </span>
                      )}
                      {!expired && !limitReached && (
                        <span className="text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 text-[10px] uppercase font-bold">
                          Active
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add Discount Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#2B302B] w-full max-w-lg p-6 space-y-4 font-mono shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#CBD5CB] pb-3">
              <h3 className="font-semibold text-sm text-[#2B302B] uppercase tracking-wider">
                Create Discount Rule
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#8A968A] uppercase mb-1">Coupon Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FLASH30"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full border border-[#CBD5CB] p-2 text-[#2B302B] uppercase focus:border-[#F57B4A] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#8A968A] uppercase mb-1">Rule Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Flash 30% Off"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-[#CBD5CB] p-2 text-[#2B302B] focus:border-[#F57B4A] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#8A968A] uppercase mb-1">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as "percentage" | "fixed")}
                    className="w-full border border-[#CBD5CB] p-2 bg-white text-[#2B302B] focus:border-[#F57B4A] focus:outline-none"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#8A968A] uppercase mb-1">Deduction *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full border border-[#CBD5CB] p-2 text-[#2B302B] focus:border-[#F57B4A] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#8A968A] uppercase mb-1">Min Spend (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={minPurchaseAmount}
                    onChange={(e) => setMinPurchaseAmount(e.target.value)}
                    className="w-full border border-[#CBD5CB] p-2 text-[#2B302B] focus:border-[#F57B4A] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#8A968A] uppercase mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full border border-[#CBD5CB] p-2 text-[#2B302B] focus:border-[#F57B4A] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#8A968A] uppercase mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full border border-[#CBD5CB] p-2 text-[#2B302B] focus:border-[#F57B4A] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#8A968A] uppercase mb-1">Usage Limit</label>
                  <input
                    type="number"
                    min="1"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                    className="w-full border border-[#CBD5CB] p-2 text-[#2B302B] focus:border-[#F57B4A] focus:outline-none"
                  />
                </div>
              </div>

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
                  {loading ? "Saving..." : "Save Discount"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
