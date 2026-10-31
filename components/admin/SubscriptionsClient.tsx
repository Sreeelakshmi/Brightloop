"use client";

import * as React from "react";
import { Subscription, Customer, Plan, Product } from "@/types";
import { PageHeader, StatusBadge } from "@/components/ui-shared";
import { formatMoney } from "@/lib/formatters";
import Link from "next/link";
import {
  Layers,
  Clock,
  Plus,
  Play,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { handleRunScheduler, handleCreateSubscription } from "@/app/actions/billing-actions";

interface SubscriptionsClientProps {
  initialSubscriptions: Subscription[];
  total: number;
  page: number;
  pageSize: number;
  customers: Customer[];
  plans: Plan[];
  products: Product[];
  isAdmin: boolean;
}

export function SubscriptionsClient({
  initialSubscriptions,
  total,
  page,
  pageSize,
  customers,
  plans,
  products,
  isAdmin,
}: SubscriptionsClientProps) {
  const [subscriptions, setSubscriptions] = React.useState<Subscription[]>(initialSubscriptions);
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [search, setSearch] = React.useState<string>("");
  const [currentPage, setCurrentPage] = React.useState<number>(page);

  // Modal State
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = React.useState(customers[0]?.id || "");
  const [selectedPlanId, setSelectedPlanId] = React.useState(plans[0]?.id || "");
  const [selectedProductId, setSelectedProductId] = React.useState(products[0]?.id || "");
  const [quantity, setQuantity] = React.useState("1");
  const [startDate, setStartDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [paymentTerms, setPaymentTerms] = React.useState("Net 15");

  const [schedulerLoading, setSchedulerLoading] = React.useState(false);
  const [schedulerResult, setSchedulerResult] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);

  const statuses = ["all", "active", "confirmed", "quotation", "draft", "closed", "cancelled"];

  const filteredSubscriptions = React.useMemo(() => {
    return subscriptions.filter((s) => {
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          s.subscriptionNumber.toLowerCase().includes(q) ||
          s.customer?.name.toLowerCase().includes(q) ||
          s.plan?.name.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [subscriptions, statusFilter, search]);

  const handleScheduler = async () => {
    setSchedulerLoading(true);
    setSchedulerResult(null);
    setActionError(null);

    const res = await handleRunScheduler();
    setSchedulerLoading(false);

    if (res.success && "processed" in res) {
      setSchedulerResult(
        `Scheduler run complete! Processed ${res.processed} active subscriptions. Closed ${res.closedCount} subscriptions due to term expiration.`
      );
      if (res.closedIds && res.closedIds.length > 0) {
        setSubscriptions(
          subscriptions.map((s) => (res.closedIds?.includes(s.id) ? { ...s, status: "closed" } : s))
        );
      }
    } else {
      setActionError(res.error || "Scheduler failed");
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);

    const prod = products.find((p) => p.id === selectedProductId);
    const unitPrice = prod?.salesPrice || 10000;

    const res = await handleCreateSubscription({
      customerId: selectedCustomerId,
      planId: selectedPlanId,
      startDate,
      paymentTerms,
      lines: [
        {
          productId: selectedProductId,
          quantity: Number(quantity),
          unitPrice,
        },
      ],
    });

    if (res.success && res.subscription) {
      setSubscriptions([res.subscription, ...subscriptions]);
      setIsModalOpen(false);
    } else {
      setActionError(res.error || "Failed to create subscription");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-mono">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader
          title="SUBSCRIPTION LEDGER"
          subtitle="Enterprise Contracts, Lifecycle Transitions & Daily Scheduler"
          logDate="31.10.2026"
        />
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={handleScheduler}
              disabled={schedulerLoading}
              className="flex items-center gap-2 bg-[#FFF4EE] hover:bg-[#FFE8DC] text-[#F57B4A] border border-[#F57B4A] px-3.5 py-2 text-xs uppercase font-semibold transition-colors disabled:opacity-50"
            >
              <Clock className="w-4 h-4" />
              {schedulerLoading ? "Running..." : "Run Scheduler"}
            </button>
          )}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-[#2B302B] hover:bg-black text-[#E4EEE4] px-4 py-2 text-xs font-mono tracking-wider uppercase border border-[#2B302B] transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Subscription
          </button>
        </div>
      </div>

      {schedulerResult && (
        <div className="bg-[#FFF4EE] border border-[#F57B4A] text-[#2B302B] p-3 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#F57B4A] flex-shrink-0" />
          <span>{schedulerResult}</span>
        </div>
      )}

      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white border border-[#CBD5CB] p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {statuses.map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 text-xs uppercase transition-colors border ${
                  statusFilter === st
                    ? "bg-[#2B302B] text-white border-[#2B302B]"
                    : "bg-[#F8FAF8] text-[#2B302B] border-[#CBD5CB] hover:bg-[#E4EEE4]"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Search subscriptions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-[#CBD5CB] px-3 py-1.5 w-64 text-xs text-[#2B302B] focus:outline-none focus:border-[#F57B4A]"
          />
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white border border-[#CBD5CB] overflow-hidden">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-[#E4EEE4] border-b border-[#CBD5CB] text-[#2B302B] uppercase">
            <tr>
              <th className="p-3">Subscription #</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Plan</th>
              <th className="p-3">Start Date</th>
              <th className="p-3">End Date</th>
              <th className="p-3">Total Amount</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E4EEE4]">
            {filteredSubscriptions.map((sub) => (
              <tr key={sub.id} className="hover:bg-[#F8FAF8] transition-colors">
                <td className="p-3 font-bold text-[#2B302B]">
                  <Link
                    href={`/subscriptions/${sub.id}`}
                    className="hover:text-[#F57B4A] underline flex items-center gap-1"
                  >
                    {sub.subscriptionNumber}
                    <ExternalLink className="w-3 h-3 opacity-60" />
                  </Link>
                </td>
                <td className="p-3">
                  <div className="font-semibold text-[#2B302B]">{sub.customer?.name}</div>
                  <div className="text-[10px] text-[#8A968A]">{sub.customer?.company}</div>
                </td>
                <td className="p-3">
                  <span className="font-medium text-[#2B302B]">{sub.plan?.name}</span>
                  {sub.paused && (
                    <span className="ml-1 text-[10px] text-[#F57B4A] font-bold">(PAUSED)</span>
                  )}
                </td>
                <td className="p-3 text-[#2B302B]">{sub.startDate}</td>
                <td className="p-3 text-[#2B302B]">{sub.endDate}</td>
                <td className="p-3 font-semibold text-[#2B302B]">
                  {formatMoney(sub.totalAmount)}
                </td>
                <td className="p-3">
                  <StatusBadge status={sub.status} />
                </td>
                <td className="p-3 text-right">
                  <Link
                    href={`/subscriptions/${sub.id}`}
                    className="px-2.5 py-1 text-[11px] border border-[#CBD5CB] text-[#2B302B] hover:bg-[#F4F7F4]"
                  >
                    Manage
                  </Link>
                </td>
              </tr>
            ))}
            {filteredSubscriptions.length === 0 && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-[#8A968A]">
                  No subscriptions match the selected criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* New Subscription Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#2B302B] w-full max-w-lg p-6 space-y-4 font-mono shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#CBD5CB] pb-3">
              <h3 className="font-semibold text-sm text-[#2B302B] uppercase tracking-wider">
                Create New Subscription
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#8A968A] hover:text-[#2B302B]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#8A968A] uppercase mb-1">Customer *</label>
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#8A968A] uppercase mb-1">Plan *</label>
                  <select
                    value={selectedPlanId}
                    onChange={(e) => setSelectedPlanId(e.target.value)}
                    className="w-full border border-[#CBD5CB] p-2 bg-white text-[#2B302B] focus:border-[#F57B4A] focus:outline-none"
                  >
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({formatMoney(p.amount)})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[#8A968A] uppercase mb-1">Primary Product *</label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full border border-[#CBD5CB] p-2 bg-white text-[#2B302B] focus:border-[#F57B4A] focus:outline-none"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#8A968A] uppercase mb-1">Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full border border-[#CBD5CB] p-2 text-[#2B302B] focus:border-[#F57B4A] focus:outline-none"
                  />
                </div>
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
                  <label className="block text-[#8A968A] uppercase mb-1">Payment Terms</label>
                  <select
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="w-full border border-[#CBD5CB] p-2 bg-white text-[#2B302B] focus:border-[#F57B4A] focus:outline-none"
                  >
                    <option value="Net 15">Net 15</option>
                    <option value="Net 30">Net 30</option>
                    <option value="Immediate">Immediate</option>
                  </select>
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
                  className="px-4 py-2 bg-[#2B302B] hover:bg-black text-[#E4EEE4]"
                >
                  Create Draft Subscription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
