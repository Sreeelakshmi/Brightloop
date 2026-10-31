"use client";

import * as React from "react";
import { Subscription, SubscriptionStatus } from "@/types";
import { PageHeader, StatusBadge } from "@/components/ui-shared";
import { formatMoney } from "@/lib/formatters";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  XCircle,
  FileCheck,
  ShieldAlert,
  Clock,
  Check,
  X,
} from "lucide-react";
import {
  handleTransitionSubscription,
  handlePauseSubscription,
  handleCloseEarlySubscription,
  handleRenewSubscription,
} from "@/app/actions/billing-actions";

interface SubscriptionDetailClientProps {
  initialSubscription: Subscription;
  isAdmin: boolean;
}

const STEPPER_STAGES: SubscriptionStatus[] = [
  "draft",
  "quotation",
  "confirmed",
  "active",
  "closed",
];

export function SubscriptionDetailClient({
  initialSubscription,
  isAdmin,
}: SubscriptionDetailClientProps) {
  const [sub, setSub] = React.useState<Subscription>(initialSubscription);
  const [loadingAction, setLoadingAction] = React.useState<string | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  const currentStageIndex = STEPPER_STAGES.indexOf(sub.status);

  const handleTransition = async (target: SubscriptionStatus, reason?: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoadingAction(`transition-${target}`);

    const res = await handleTransitionSubscription(sub.id, target, reason);
    setLoadingAction(null);

    if (res.success && res.subscription) {
      setSub(res.subscription);
      setSuccessMsg(`Status successfully transitioned to ${target.toUpperCase()}!`);
    } else {
      setErrorMsg(res.error || `Failed to transition to ${target}`);
    }
  };

  const handlePause = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoadingAction("pause");

    const res = await handlePauseSubscription(sub.id);
    setLoadingAction(null);

    if (res.success && res.subscription) {
      setSub(res.subscription);
      setSuccessMsg(res.subscription.paused ? "Subscription paused" : "Subscription resumed");
    } else {
      setErrorMsg(res.error || "Failed to toggle pause");
    }
  };

  const handleCloseEarly = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoadingAction("close-early");

    const res = await handleCloseEarlySubscription(sub.id);
    setLoadingAction(null);

    if (res.success && res.subscription) {
      setSub(res.subscription);
      setSuccessMsg("Subscription closed early per plan rules");
    } else {
      setErrorMsg(res.error || "Failed to close subscription early");
    }
  };

  const handleRenew = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoadingAction("renew");

    const res = await handleRenewSubscription(sub.id);
    setLoadingAction(null);

    if (res.success && res.subscription) {
      setSub(res.subscription);
      setSuccessMsg(`Subscription extended through ${res.subscription.endDate}`);
    } else {
      setErrorMsg(res.error || "Failed to renew subscription");
    }
  };

  const plan = sub.plan;

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-mono">
      {/* Top Navigation & Status */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#CBD5CB] pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/subscriptions"
            className="p-2 border border-[#CBD5CB] hover:bg-[#E4EEE4] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-[#2B302B]" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[#2B302B]">{sub.subscriptionNumber}</h1>
              <StatusBadge status={sub.status} />
              {sub.paused && (
                <span className="bg-[#FFF4EE] text-[#F57B4A] border border-[#F57B4A] px-2 py-0.5 text-[10px] uppercase font-bold">
                  Paused
                </span>
              )}
            </div>
            <p className="text-xs text-[#8A968A] mt-0.5">
              Customer: <strong className="text-[#2B302B]">{sub.customer?.name}</strong> • Plan:{" "}
              <strong className="text-[#2B302B]">{plan?.name}</strong>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {sub.status === "draft" && (
            <button
              onClick={() => handleTransition("quotation", "Generated quotation proposal")}
              disabled={Boolean(loadingAction)}
              className="bg-[#2B302B] hover:bg-black text-[#E4EEE4] px-4 py-2 uppercase font-semibold transition-colors"
            >
              Generate Quotation &rarr;
            </button>
          )}

          {sub.status === "quotation" && (
            <button
              onClick={() => handleTransition("confirmed", "Customer confirmed quotation")}
              disabled={Boolean(loadingAction)}
              className="bg-[#2B302B] hover:bg-black text-[#E4EEE4] px-4 py-2 uppercase font-semibold transition-colors"
            >
              Confirm Quotation &rarr;
            </button>
          )}

          {sub.status === "confirmed" && (
            <button
              onClick={() => handleTransition("active", "Activated subscription contract")}
              disabled={Boolean(loadingAction)}
              className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 uppercase font-semibold transition-colors"
            >
              Activate Contract &rarr;
            </button>
          )}

          {sub.status === "active" && (
            <>
              {/* Pause Toggle */}
              <button
                onClick={handlePause}
                disabled={Boolean(loadingAction) || !plan?.pausable}
                title={!plan?.pausable ? "Plan policy does not permit pausing" : ""}
                className={`px-3 py-2 border uppercase flex items-center gap-1.5 ${
                  plan?.pausable
                    ? "border-[#CBD5CB] hover:bg-[#E4EEE4] text-[#2B302B]"
                    : "border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed"
                }`}
              >
                {sub.paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                {sub.paused ? "Resume" : "Pause"}
              </button>

              {/* Close Early */}
              <button
                onClick={handleCloseEarly}
                disabled={Boolean(loadingAction) || !plan?.closableEarly}
                title={!plan?.closableEarly ? "Plan policy forbids early close" : ""}
                className={`px-3 py-2 border uppercase flex items-center gap-1.5 ${
                  plan?.closableEarly
                    ? "border-red-300 text-red-700 hover:bg-red-50"
                    : "border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed"
                }`}
              >
                <XCircle className="w-3.5 h-3.5" />
                Close Early
              </button>

              {/* Renew */}
              <button
                onClick={handleRenew}
                disabled={Boolean(loadingAction) || !plan?.renewable}
                title={!plan?.renewable ? "Plan policy is non-renewable" : ""}
                className={`px-3 py-2 border uppercase flex items-center gap-1.5 ${
                  plan?.renewable
                    ? "border-[#CBD5CB] hover:bg-[#E4EEE4] text-[#2B302B]"
                    : "border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed"
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Renew
              </button>
            </>
          )}

          {sub.status !== "closed" && sub.status !== "cancelled" && (
            <button
              onClick={() => handleTransition("cancelled", "Cancelled by administrator")}
              disabled={Boolean(loadingAction)}
              className="text-[#8A968A] hover:text-red-700 px-3 py-2 uppercase underline text-[11px]"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-800 p-3 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 5-Stage Lifecycle Stepper */}
      <div className="bg-white border border-[#CBD5CB] p-6">
        <div className="text-[11px] uppercase tracking-wider text-[#8A968A] mb-4">
          Lifecycle State Progression
        </div>
        <div className="flex items-center justify-between">
          {STEPPER_STAGES.map((stage, idx) => {
            const isCompleted = currentStageIndex > idx || (sub.status === "closed" && idx === 4);
            const isCurrent = sub.status === stage;
            return (
              <React.Fragment key={stage}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-all ${
                      isCurrent
                        ? "bg-[#F57B4A] border-[#F57B4A] text-white shadow-md scale-110"
                        : isCompleted
                        ? "bg-[#2B302B] border-[#2B302B] text-white"
                        : "bg-[#F8FAF8] border-[#CBD5CB] text-[#8A968A]"
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : idx + 1}
                  </div>
                  <span
                    className={`text-[11px] uppercase mt-2 font-semibold ${
                      isCurrent
                        ? "text-[#F57B4A]"
                        : isCompleted
                        ? "text-[#2B302B]"
                        : "text-[#8A968A]"
                    }`}
                  >
                    {stage}
                  </span>
                </div>
                {idx < STEPPER_STAGES.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-3 ${
                      currentStageIndex > idx ? "bg-[#2B302B]" : "bg-[#CBD5CB]"
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Contract Details & Lines */}
        <div className="lg:col-span-2 space-y-6">
          {/* Metadata Card */}
          <div className="bg-white border border-[#CBD5CB] p-5 space-y-4 text-xs">
            <h3 className="font-semibold text-sm text-[#2B302B] uppercase tracking-wider border-b border-[#CBD5CB] pb-2">
              Contract Schedule & Terms
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <span className="text-[#8A968A] uppercase block text-[10px]">Start Date</span>
                <span className="font-bold text-[#2B302B] mt-0.5 block">{sub.startDate}</span>
              </div>
              <div>
                <span className="text-[#8A968A] uppercase block text-[10px]">End Date</span>
                <span className="font-bold text-[#2B302B] mt-0.5 block">{sub.endDate}</span>
              </div>
              <div>
                <span className="text-[#8A968A] uppercase block text-[10px]">Billing Cycle</span>
                <span className="font-bold text-[#2B302B] mt-0.5 block uppercase">
                  {plan?.billingPeriod || plan?.billingCycle}
                </span>
              </div>
              <div>
                <span className="text-[#8A968A] uppercase block text-[10px]">Payment Terms</span>
                <span className="font-bold text-[#2B302B] mt-0.5 block">{sub.paymentTerms || "Net 15"}</span>
              </div>
            </div>
          </div>

          {/* Order Lines Table */}
          <div className="bg-white border border-[#CBD5CB] overflow-hidden">
            <div className="p-4 border-b border-[#CBD5CB] bg-[#F8FAF8] flex justify-between items-center">
              <h3 className="font-semibold text-xs text-[#2B302B] uppercase tracking-wider">
                Order Lines & Billing Items
              </h3>
              <span className="text-xs text-[#8A968A]">
                Total: <strong className="text-[#2B302B]">{formatMoney(sub.totalAmount)}</strong>
              </span>
            </div>
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#E4EEE4] border-b border-[#CBD5CB] text-[#2B302B] uppercase">
                <tr>
                  <th className="p-3">Description</th>
                  <th className="p-3 text-right">Quantity</th>
                  <th className="p-3 text-right">Unit Price</th>
                  <th className="p-3 text-right">Tax (18%)</th>
                  <th className="p-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4EEE4]">
                {(sub.lines || []).map((l, i) => (
                  <tr key={l.id || i}>
                    <td className="p-3 font-medium text-[#2B302B]">{l.description}</td>
                    <td className="p-3 text-right">{l.quantity}</td>
                    <td className="p-3 text-right">{formatMoney(l.unitPrice)}</td>
                    <td className="p-3 text-right text-[#8A968A]">
                      {formatMoney(l.taxAmount || Math.round(l.amount * 0.18))}
                    </td>
                    <td className="p-3 text-right font-bold text-[#2B302B]">
                      {formatMoney(l.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Plan Policies & Status History */}
        <div className="space-y-6">
          {/* Plan Policies Card */}
          <div className="bg-white border border-[#CBD5CB] p-5 space-y-3 text-xs">
            <h3 className="font-semibold text-sm text-[#2B302B] uppercase tracking-wider border-b border-[#CBD5CB] pb-2">
              Plan Policy Enforcement
            </h3>
            <p className="text-[11px] text-[#8A968A]">
              Action buttons and scheduler operations are strictly governed by the underlying plan flags:
            </p>
            <div className="space-y-2 pt-1 text-[11px]">
              <div className="flex justify-between items-center">
                <span>Auto-Close on End Date:</span>
                {plan?.autoClose ? (
                  <span className="text-orange-600 font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> YES
                  </span>
                ) : (
                  <span className="text-[#8A968A] flex items-center gap-1">
                    <X className="w-3.5 h-3.5" /> NO
                  </span>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span>Closable Early:</span>
                {plan?.closableEarly ? (
                  <span className="text-green-700 font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> ALLOWED
                  </span>
                ) : (
                  <span className="text-[#8A968A] flex items-center gap-1">
                    <X className="w-3.5 h-3.5" /> BLOCKED
                  </span>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span>Pausable:</span>
                {plan?.pausable ? (
                  <span className="text-green-700 font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> ALLOWED
                  </span>
                ) : (
                  <span className="text-[#8A968A] flex items-center gap-1">
                    <X className="w-3.5 h-3.5" /> BLOCKED
                  </span>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span>Renewable:</span>
                {plan?.renewable ? (
                  <span className="text-green-700 font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> ALLOWED
                  </span>
                ) : (
                  <span className="text-[#8A968A] flex items-center gap-1">
                    <X className="w-3.5 h-3.5" /> BLOCKED
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Audit History Timeline */}
          <div className="bg-white border border-[#CBD5CB] p-5 space-y-4 text-xs">
            <h3 className="font-semibold text-sm text-[#2B302B] uppercase tracking-wider border-b border-[#CBD5CB] pb-2">
              Status Audit History
            </h3>
            <div className="space-y-3">
              {(sub.history || []).map((h, i) => (
                <div key={h.id || i} className="border-l-2 border-[#2B302B] pl-3 py-1 space-y-0.5">
                  <div className="flex items-center justify-between text-[10px] text-[#8A968A]">
                    <span>{new Date(h.changedAt).toLocaleString("en-IN")}</span>
                    <span className="font-semibold text-[#2B302B]">{h.changedBy}</span>
                  </div>
                  <div className="font-bold text-[#2B302B] text-[11px] uppercase">
                    {h.fromStatus} &rarr; {h.toStatus}
                  </div>
                  {h.reason && (
                    <div className="text-[10px] text-[#8A968A] italic">{h.reason}</div>
                  )}
                </div>
              ))}
              {(!sub.history || sub.history.length === 0) && (
                <div className="text-[#8A968A] text-center py-4">No audit log entries yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
