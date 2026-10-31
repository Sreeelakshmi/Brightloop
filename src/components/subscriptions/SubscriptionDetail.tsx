"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { THEME } from "./theme";
import { StatusBadge } from "./StatusBadge";
import { getAllowedTransitions } from "@/lib/subscription/transitions";
import { calculateSubscriptionTotal } from "@/lib/subscription/pricing";
import {
  changeSubscriptionStatusAction,
  renewSubscriptionAction,
} from "@/app/(dashboard)/subscriptions/actions";
import type { SubscriptionWithDetails } from "@/types/subscription-services";
import type { SubscriptionStatus, UserRole } from "@/types";

interface SubscriptionDetailProps {
  subscription: SubscriptionWithDetails;
  role: UserRole;
}

export function SubscriptionDetail({ subscription, role }: SubscriptionDetailProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canMutate = role !== "customer";
  const allowedNext = getAllowedTransitions(subscription.status, subscription.plan);
  const canRenew = subscription.status === "active" && subscription.plan?.renewable;
  const total = calculateSubscriptionTotal(subscription.lines);

  const handleStatusChange = async (nextStatus: SubscriptionStatus) => {
    if (nextStatus === "closed") {
      if (!confirm("Are you sure you want to permanently close this contract?")) return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await changeSubscriptionStatusAction(subscription.id, nextStatus);
      if (!res.success) setError(res.error ?? "Failed to change status.");
      else router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const handleRenew = async () => {
    if (!confirm("Extend subscription expiry by one billing period?")) return;
    setLoading(true);
    setError(null);
    try {
      const res = await renewSubscriptionAction(subscription.id);
      if (!res.success) setError(res.error ?? "Failed to renew subscription.");
      else router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Card */}
      <div className={`p-6 ${THEME.card}`}>
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b border-[#D5DDD2]">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold font-mono tracking-tight text-[#1F2622]">{subscription.number}</h1>
              <StatusBadge status={subscription.status} />
            </div>
            <p className="text-xs text-[#657367] mt-1">Plan: <span className="font-semibold text-[#1F2622]">{subscription.plan?.name ?? "Custom"}</span> (${subscription.plan?.price ?? 0}/{subscription.plan?.billingPeriod ?? "mo"})</p>
          </div>
          {canMutate && (
            <div className="flex flex-wrap gap-2">
              {allowedNext.map((st) => (
                <button
                  key={st}
                  disabled={loading}
                  onClick={() => handleStatusChange(st)}
                  className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${st === "closed" ? THEME.accentOrange.button : THEME.primaryDark.button}`}
                >
                  Mark {st}
                </button>
              ))}
              {canRenew && (
                <button
                  disabled={loading}
                  onClick={handleRenew}
                  className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${THEME.secondaryButton} flex items-center gap-1`}
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Renew
                </button>
              )}
            </div>
          )}
        </div>

        {error && <div className="p-3 mt-4 rounded-lg bg-[#FDEEE7] text-[#D95522] text-sm border border-[#F27B4B]">{error}</div>}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs">
          <div><span className="text-[#657367] uppercase font-bold">Start Date:</span><p className="font-mono mt-0.5">{subscription.startDate}</p></div>
          <div><span className="text-[#657367] uppercase font-bold">Expiry Date:</span><p className="font-mono mt-0.5">{subscription.expiryDate}</p></div>
          <div><span className="text-[#657367] uppercase font-bold">Next Billing:</span><p className="font-mono mt-0.5">{subscription.nextBillingDate ?? "Not scheduled"}</p></div>
          <div><span className="text-[#657367] uppercase font-bold">Payment Terms:</span><p className="font-mono mt-0.5 uppercase">{subscription.paymentTerms.replace("_", " ")}</p></div>
        </div>
      </div>

      {/* Line Items Table */}
      <div className={THEME.tableWrapper}>
        <div className="p-4 border-b border-[#D5DDD2] bg-[#DDE5DB] flex justify-between items-center">
          <span className="text-xs font-bold uppercase tracking-wider text-[#1F2622]">Contract Items</span>
          <span className="text-xs font-mono font-bold text-[#1F2622]">Total: ${total.toFixed(2)}</span>
        </div>
        <table className="w-full text-sm text-left">
          <thead className={THEME.mutedSage.tableHeader}>
            <tr>
              <th className="px-4 py-2.5">Product ID</th>
              <th className="px-4 py-2.5">Qty</th>
              <th className="px-4 py-2.5">Unit Price</th>
              <th className="px-4 py-2.5 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D5DDD2]">
            {subscription.lines.map((l) => (
              <tr key={l.id} className="hover:bg-[#F3F7F2]">
                <td className="px-4 py-2.5 font-mono text-xs">{l.productId}</td>
                <td className="px-4 py-2.5">{l.quantity}</td>
                <td className="px-4 py-2.5 font-mono">${l.unitPrice.toFixed(2)}</td>
                <td className="px-4 py-2.5 text-right font-mono font-semibold">${l.amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Audit History */}
      <div className={`p-5 ${THEME.card}`}>
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#657367] mb-3">Status Audit Trail</h3>
        <div className="space-y-2">
          {subscription.history.map((h) => (
            <div key={h.id} className="flex justify-between items-center text-xs py-1.5 border-b border-[#D5DDD2] last:border-0">
              <div className="flex items-center gap-2">
                <span className="text-[#657367]">{h.fromStatus ? h.fromStatus.toUpperCase() : "CREATION"}</span>
                <span>&rarr;</span>
                <span className="font-bold text-[#1F2622]">{h.toStatus.toUpperCase()}</span>
              </div>
              <span className="font-mono text-[#8C9B8E]">{new Date(h.changedAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
