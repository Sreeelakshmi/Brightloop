"use client";

import * as React from "react";
import { Subscription } from "@/types";
import { PageHeader, StatusBadge } from "@/components/ui-shared";
import { formatMoney } from "@/lib/formatters";
import Link from "next/link";
import { ArrowRight, CheckCircle2, AlertTriangle, Copy, ExternalLink } from "lucide-react";
import { handleTransitionSubscription } from "@/app/actions/billing-actions";

interface QuotationsClientProps {
  initialQuotations: Subscription[];
  isAdmin: boolean;
}

export function QuotationsClient({ initialQuotations, isAdmin }: QuotationsClientProps) {
  const [quotations, setQuotations] = React.useState<Subscription[]>(initialQuotations);
  const [search, setSearch] = React.useState("");
  const [loadingId, setLoadingId] = React.useState<string | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  const filtered = React.useMemo(() => {
    return quotations.filter((q) => {
      if (!search) return true;
      const s = search.toLowerCase();
      return (
        q.subscriptionNumber.toLowerCase().includes(s) ||
        q.customer?.name.toLowerCase().includes(s) ||
        q.plan?.name.toLowerCase().includes(s)
      );
    });
  }, [quotations, search]);

  const handleConfirm = async (sub: Subscription) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoadingId(sub.id);

    const res = await handleTransitionSubscription(sub.id, "confirmed", "Confirmed from quotations portal");
    setLoadingId(null);

    if (res.success && res.subscription) {
      setSuccessMsg(`Quotation ${sub.subscriptionNumber} confirmed successfully!`);
      setQuotations(quotations.map((q) => (q.id === sub.id ? res.subscription! : q)));
    } else {
      setErrorMsg(res.error || "Failed to confirm quotation");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader
          title="SALES QUOTATIONS"
          subtitle="Draft Proposals, Validity Windows & Customer Acceptance"
          logDate="31.10.2026"
        />
        <Link
          href="/quotation-templates"
          className="flex items-center gap-2 bg-[#2B302B] hover:bg-black text-[#E4EEE4] px-4 py-2 text-xs font-mono tracking-wider uppercase border border-[#2B302B] transition-colors"
        >
          <Copy className="w-4 h-4" />
          Create From Template
        </Link>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 text-xs font-mono flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-800 p-3 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filter / Search */}
      <div className="bg-white border border-[#CBD5CB] p-4 flex items-center justify-between gap-4 text-xs font-mono">
        <input
          type="text"
          placeholder="Search by quote #, customer, or plan..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-[#CBD5CB] px-3 py-1.5 w-72 text-[#2B302B] focus:outline-none focus:border-[#F57B4A]"
        />
        <div className="text-[#8A968A] uppercase">
          Total Quotations: <strong className="text-[#2B302B]">{filtered.length}</strong>
        </div>
      </div>

      {/* Quotations Table */}
      <div className="bg-white border border-[#CBD5CB] overflow-hidden">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-[#E4EEE4] border-b border-[#CBD5CB] text-[#2B302B] uppercase">
            <tr>
              <th className="p-3">Quotation #</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Plan</th>
              <th className="p-3">Valid Until</th>
              <th className="p-3">Total Amount</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E4EEE4]">
            {filtered.map((q) => {
              const isExpired = Boolean(q.validUntil && q.validUntil < today);
              return (
                <tr key={q.id} className="hover:bg-[#F8FAF8] transition-colors">
                  <td className="p-3 font-bold text-[#2B302B]">
                    <Link
                      href={`/subscriptions/${q.id}`}
                      className="hover:text-[#F57B4A] underline flex items-center gap-1"
                    >
                      {q.subscriptionNumber}
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </Link>
                  </td>
                  <td className="p-3">
                    <div className="font-semibold text-[#2B302B]">{q.customer?.name}</div>
                    <div className="text-[10px] text-[#8A968A]">{q.customer?.company}</div>
                  </td>
                  <td className="p-3 text-[#2B302B]">{q.plan?.name}</td>
                  <td className="p-3">
                    {q.validUntil ? (
                      <div>
                        <span className={isExpired ? "text-red-600 font-semibold" : "text-[#2B302B]"}>
                          {q.validUntil}
                        </span>
                        {isExpired && (
                          <span className="ml-2 text-[10px] bg-red-50 text-red-600 border border-red-200 px-1.5 py-0.2 uppercase font-semibold">
                            Expired
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[#8A968A]">No Expiry</span>
                    )}
                  </td>
                  <td className="p-3 font-semibold text-[#2B302B]">
                    {formatMoney(q.totalAmount)}
                  </td>
                  <td className="p-3">
                    <StatusBadge status={q.status} />
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {q.status === "quotation" && (
                        <button
                          onClick={() => handleConfirm(q)}
                          disabled={isExpired || loadingId === q.id}
                          title={isExpired ? `Quotation expired on ${q.validUntil}` : "Confirm Quotation"}
                          className={`px-3 py-1 text-[11px] font-mono uppercase tracking-wider border transition-colors ${
                            isExpired
                              ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                              : "bg-[#2B302B] hover:bg-black text-[#E4EEE4] border-[#2B302B]"
                          }`}
                        >
                          {loadingId === q.id ? "Confirming..." : "Confirm"}
                        </button>
                      )}
                      <Link
                        href={`/subscriptions/${q.id}`}
                        className="px-2.5 py-1 text-[11px] border border-[#CBD5CB] text-[#2B302B] hover:bg-[#F4F7F4]"
                      >
                        View
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-[#8A968A]">
                  No quotations found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
