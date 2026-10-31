"use client";

import * as React from "react";
import { Plan, PlanBillingPeriod } from "@/types";
import { PageHeader, StatusBadge } from "@/components/ui-shared";
import { formatMoney } from "@/lib/formatters";
import { Plus, Check, X, Calendar, Layers } from "lucide-react";
import { handleCreatePlan } from "@/app/actions/billing-actions";
import { validatePlanAvailability } from "@/lib/business-rules";

interface PlansClientProps {
  initialPlans: Plan[];
  isAdmin: boolean;
}

export function PlansClient({ initialPlans, isAdmin }: PlansClientProps) {
  const [plans, setPlans] = React.useState<Plan[]>(initialPlans);
  const [search, setSearch] = React.useState("");

  // Modal state
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [code, setCode] = React.useState("");
  const [billingPeriod, setBillingPeriod] = React.useState<PlanBillingPeriod>("monthly");
  const [amount, setAmount] = React.useState("10000");
  const [minimumQuantity, setMinimumQuantity] = React.useState("1");
  const [availableFrom, setAvailableFrom] = React.useState("2026-01-01");
  const [availableTo, setAvailableTo] = React.useState("2026-12-31");
  const [description, setDescription] = React.useState("");
  const [autoClose, setAutoClose] = React.useState(false);
  const [closableEarly, setClosableEarly] = React.useState(true);
  const [pausable, setPausable] = React.useState(true);
  const [renewable, setRenewable] = React.useState(true);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const filteredPlans = React.useMemo(() => {
    return plans.filter((p) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      );
    });
  }, [plans, search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await handleCreatePlan({
      name,
      code,
      billingPeriod,
      amount: Number(amount),
      minimumQuantity: Number(minimumQuantity),
      availableFrom,
      availableTo,
      description,
      autoClose,
      closableEarly,
      pausable,
      renewable,
    });

    setLoading(false);
    if (res.success && res.plan) {
      setPlans([res.plan, ...plans]);
      setIsModalOpen(false);
      setName("");
      setCode("");
      setDescription("");
    } else {
      setError(res.error || "Failed to create plan");
    }
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader
          title="SUBSCRIPTION PLANS"
          subtitle="Tier Models, Availability Windows & Contract Flags"
          logDate="31.10.2026"
        />
        {isAdmin && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-[#2B302B] hover:bg-black text-[#E4EEE4] px-4 py-2 text-xs font-mono tracking-wider uppercase border border-[#2B302B] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Plan
          </button>
        )}
      </div>

      {/* Filter / Search */}
      <div className="bg-white border border-[#CBD5CB] p-4 flex items-center justify-between gap-4 text-xs font-mono">
        <input
          type="text"
          placeholder="Search plan by name or code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-[#CBD5CB] px-3 py-1.5 w-72 text-[#2B302B] focus:outline-none focus:border-[#F57B4A]"
        />
        <div className="text-[#8A968A] uppercase">
          Total Plans: <strong className="text-[#2B302B]">{filteredPlans.length}</strong>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-mono">
        {filteredPlans.map((plan) => {
          const avail = validatePlanAvailability(plan, today);
          return (
            <div
              key={plan.id}
              className="bg-white border border-[#CBD5CB] p-5 flex flex-col justify-between space-y-4 hover:border-[#2B302B] transition-colors relative"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-[#E4EEE4] text-[#2B302B]">
                    {plan.code}
                  </span>
                  {avail.valid ? (
                    <span className="text-[10px] uppercase font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5">
                      Available
                    </span>
                  ) : (
                    <span className="text-[10px] uppercase font-semibold text-[#F57B4A] bg-[#FFF4EE] border border-[#F57B4A] px-2 py-0.5">
                      Window Closed
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-sm text-[#2B302B]">{plan.name}</h3>
                <p className="text-[11px] text-[#8A968A] mt-1 line-clamp-2">
                  {plan.description || "No description provided."}
                </p>

                <div className="mt-4 pt-3 border-t border-[#E4EEE4] flex items-baseline justify-between">
                  <div className="text-2xl font-bold text-[#2B302B]">
                    {formatMoney(plan.amount)}
                  </div>
                  <div className="text-xs uppercase text-[#8A968A]">
                    /{plan.billingPeriod || plan.billingCycle}
                  </div>
                </div>

                <div className="mt-2 text-[11px] text-[#8A968A]">
                  Min Quantity:{" "}
                  <strong className="text-[#2B302B]">{plan.minimumQuantity || 1} units</strong>
                </div>

                <div className="mt-1 text-[11px] text-[#8A968A]">
                  Window: {plan.availableFrom || "2026-01-01"} &rarr; {plan.availableTo || "2026-12-31"}
                </div>
              </div>

              {/* Option Toggles Status */}
              <div className="pt-3 border-t border-[#E4EEE4] space-y-1.5 text-[11px]">
                <div className="flex justify-between items-center text-[#2B302B]">
                  <span>Auto-close on end date:</span>
                  {plan.autoClose ? (
                    <span className="text-orange-600 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> YES
                    </span>
                  ) : (
                    <span className="text-[#8A968A] flex items-center gap-1">
                      <X className="w-3.5 h-3.5" /> NO
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center text-[#2B302B]">
                  <span>Closable early:</span>
                  {plan.closableEarly ? (
                    <span className="text-green-700 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> YES
                    </span>
                  ) : (
                    <span className="text-[#8A968A] flex items-center gap-1">
                      <X className="w-3.5 h-3.5" /> NO
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center text-[#2B302B]">
                  <span>Pausable:</span>
                  {plan.pausable ? (
                    <span className="text-green-700 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> YES
                    </span>
                  ) : (
                    <span className="text-[#8A968A] flex items-center gap-1">
                      <X className="w-3.5 h-3.5" /> NO
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center text-[#2B302B]">
                  <span>Renewable:</span>
                  {plan.renewable ? (
                    <span className="text-green-700 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> YES
                    </span>
                  ) : (
                    <span className="text-[#8A968A] flex items-center gap-1">
                      <X className="w-3.5 h-3.5" /> NO
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Plan Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#2B302B] w-full max-w-lg p-6 space-y-4 font-mono shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#CBD5CB] pb-3">
              <h3 className="font-semibold text-sm text-[#2B302B] uppercase tracking-wider">
                Create New Plan
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
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

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#8A968A] uppercase mb-1">Plan Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Scale High-Velocity"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-[#CBD5CB] p-2 text-[#2B302B] focus:border-[#F57B4A] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#8A968A] uppercase mb-1">Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SCALE-HI"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full border border-[#CBD5CB] p-2 text-[#2B302B] uppercase focus:border-[#F57B4A] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#8A968A] uppercase mb-1">Period</label>
                  <select
                    value={billingPeriod}
                    onChange={(e) => setBillingPeriod(e.target.value as PlanBillingPeriod)}
                    className="w-full border border-[#CBD5CB] p-2 bg-white text-[#2B302B] focus:border-[#F57B4A] focus:outline-none"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#8A968A] uppercase mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full border border-[#CBD5CB] p-2 text-[#2B302B] focus:border-[#F57B4A] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#8A968A] uppercase mb-1">Min Qty *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={minimumQuantity}
                    onChange={(e) => setMinimumQuantity(e.target.value)}
                    className="w-full border border-[#CBD5CB] p-2 text-[#2B302B] focus:border-[#F57B4A] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#8A968A] uppercase mb-1">Available From</label>
                  <input
                    type="date"
                    value={availableFrom}
                    onChange={(e) => setAvailableFrom(e.target.value)}
                    className="w-full border border-[#CBD5CB] p-2 text-[#2B302B] focus:border-[#F57B4A] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#8A968A] uppercase mb-1">Available To</label>
                  <input
                    type="date"
                    value={availableTo}
                    onChange={(e) => setAvailableTo(e.target.value)}
                    className="w-full border border-[#CBD5CB] p-2 text-[#2B302B] focus:border-[#F57B4A] focus:outline-none"
                  />
                </div>
              </div>

              {/* Option Toggles */}
              <div className="border border-[#CBD5CB] p-3 bg-[#F8FAF8] space-y-2">
                <div className="font-semibold text-[#2B302B] uppercase text-[11px] mb-1">
                  Plan Policy Flags
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoClose}
                    onChange={(e) => setAutoClose(e.target.checked)}
                    className="accent-[#F57B4A]"
                  />
                  <span className="text-[#2B302B]">
                    Auto-close subscription on end date (Daily job)
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={closableEarly}
                    onChange={(e) => setClosableEarly(e.target.checked)}
                    className="accent-[#2B302B]"
                  />
                  <span className="text-[#2B302B]">Allow customer to close early</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pausable}
                    onChange={(e) => setPausable(e.target.checked)}
                    className="accent-[#2B302B]"
                  />
                  <span className="text-[#2B302B]">Allow pause & resume</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={renewable}
                    onChange={(e) => setRenewable(e.target.checked)}
                    className="accent-[#2B302B]"
                  />
                  <span className="text-[#2B302B]">Allow renewal</span>
                </label>
              </div>

              <div>
                <label className="block text-[#8A968A] uppercase mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Plan feature notes..."
                  className="w-full border border-[#CBD5CB] p-2 text-[#2B302B] focus:border-[#F57B4A] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-[#CBD5CB]">
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
                  {loading ? "Creating..." : "Save Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
