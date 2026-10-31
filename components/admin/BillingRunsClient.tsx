"use client";

import * as React from "react";
import { BillingRun } from "@/types";
import { PageHeader } from "@/components/ui-shared";
import { Play, CheckCircle2, AlertTriangle, Layers, FileText, Check } from "lucide-react";
import { handleRunBillingEngine } from "@/app/actions/billing-actions";

interface BillingRunsClientProps {
  initialRuns: BillingRun[];
  isAdmin: boolean;
}

export function BillingRunsClient({ initialRuns, isAdmin }: BillingRunsClientProps) {
  const [runs, setRuns] = React.useState<BillingRun[]>(initialRuns);
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  const handleTrigger = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    const res = await handleRunBillingEngine();
    setLoading(false);

    if (res.success && res.billingRun) {
      setRuns([res.billingRun, ...runs]);
      setSuccessMsg(
        `Billing run complete! Created ${res.billingRun.invoicesCreated} invoices, skipped ${res.billingRun.invoicesSkipped} existing/idempotent periods.`
      );
    } else {
      setErrorMsg(res.error || "Billing engine run failed");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-mono">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader
          title="AUTOMATED BILLING RUNS"
          subtitle="Idempotent Recurring Invoice Engine & Period Reconciliation Audit"
          logDate="31.10.2026"
        />
        {isAdmin && (
          <button
            onClick={handleTrigger}
            disabled={loading}
            className="flex items-center gap-2 bg-[#2B302B] hover:bg-black text-[#E4EEE4] px-4 py-2 text-xs font-mono tracking-wider uppercase border border-[#2B302B] transition-colors disabled:opacity-50"
          >
            <Play className="w-4 h-4 text-[#F57B4A]" />
            {loading ? "Processing Invoices..." : "Run Billing Engine Now"}
          </button>
        )}
      </div>

      {successMsg && (
        <div className="bg-[#FFF4EE] border border-[#F57B4A] text-[#2B302B] p-3 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#F57B4A] flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Audit Table */}
      <div className="bg-white border border-[#CBD5CB] overflow-hidden">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-[#E4EEE4] border-b border-[#CBD5CB] text-[#2B302B] uppercase">
            <tr>
              <th className="p-3">Run ID</th>
              <th className="p-3">Execution Time</th>
              <th className="p-3">Triggered By</th>
              <th className="p-3 text-right">Subscriptions Scanned</th>
              <th className="p-3 text-right">Invoices Created</th>
              <th className="p-3 text-right">Idempotent Skipped</th>
              <th className="p-3 text-right">Errors</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E4EEE4]">
            {runs.map((r) => (
              <tr key={r.id} className="hover:bg-[#F8FAF8] transition-colors">
                <td className="p-3 font-bold text-[#2B302B]">{r.id}</td>
                <td className="p-3 text-[#2B302B]">
                  {new Date(r.runDate).toLocaleString("en-IN")}
                </td>
                <td className="p-3 text-[#8A968A]">{r.runBy}</td>
                <td className="p-3 text-right font-semibold text-[#2B302B]">
                  {r.subscriptionsProcessed}
                </td>
                <td className="p-3 text-right font-bold text-green-700">
                  +{r.invoicesCreated}
                </td>
                <td className="p-3 text-right font-medium text-[#8A968A]">
                  {r.invoicesSkipped}
                </td>
                <td className="p-3 text-right">
                  {r.failedCount > 0 ? (
                    <span className="text-red-700 font-bold">{r.failedCount}</span>
                  ) : (
                    <span className="text-green-700 font-bold">0</span>
                  )}
                </td>
              </tr>
            ))}
            {runs.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-[#8A968A]">
                  No billing runs executed yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
