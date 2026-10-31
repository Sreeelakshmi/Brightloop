"use client";

import React from "react";
import Link from "next/link";
import { Plus, Repeat, Eye } from "lucide-react";
import { THEME } from "./theme";
import { StatusBadge } from "./StatusBadge";
import { FilterBar } from "./FilterBar";
import type { SubscriptionWithDetails } from "@/types/subscription-services";
import type { SubscriptionStatus, UserRole } from "@/types";

const ALL_STATUSES: SubscriptionStatus[] = [
  "draft",
  "quotation",
  "confirmed",
  "active",
  "paused",
  "closed",
];

interface SubscriptionTableProps {
  subscriptions: SubscriptionWithDetails[];
  total: number;
  currentPage: number;
  pageSize?: number;
  role: UserRole;
  selectedStatus?: SubscriptionStatus | "";
  onStatusChange: (status: SubscriptionStatus | "") => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onPageChange: (p: number) => void;
  loading?: boolean;
}

export function SubscriptionTable({
  subscriptions,
  total,
  currentPage,
  pageSize = 20,
  role,
  selectedStatus = "",
  onStatusChange,
  searchQuery,
  onSearchChange,
  onPageChange,
  loading = false,
}: SubscriptionTableProps) {
  const canCreate = role !== "customer";
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      {/* Filters & Actions via FilterBar */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        searchPlaceholder="Search contract #..."
        onReset={() => {
          onSearchChange("");
          onStatusChange("");
        }}
        actionButton={
          canCreate ? (
            <Link href="/subscriptions/new">
              <button className={`px-4 py-2 ${THEME.primaryDark.button} flex items-center gap-1.5 text-xs uppercase tracking-wider whitespace-nowrap`}>
                <Plus className="w-4 h-4" /> New Contract
              </button>
            </Link>
          ) : undefined
        }
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#657367]">Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value as SubscriptionStatus | "")}
            className={`w-36 capitalize ${THEME.input}`}
          >
            <option value="">All Statuses</option>
            {ALL_STATUSES.map((st) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>
      </FilterBar>

      {loading ? (
        <div className="p-12 text-center text-sm text-[#657367]">Loading subscriptions...</div>
      ) : subscriptions.length === 0 ? (
        <div className={`p-12 text-center ${THEME.card} border-dashed`}>
          <Repeat className="w-10 h-10 text-[#8C9B8E] mx-auto mb-2" />
          <p className="font-bold uppercase text-sm text-[#1F2622]">No subscriptions found</p>
          <p className="text-xs text-[#657367]">Adjust status filters or create a new contract from a proposal template.</p>
        </div>
      ) : (
        <div className={THEME.tableWrapper}>
          <table className="w-full text-sm text-left">
            <thead className={THEME.mutedSage.tableHeader}>
              <tr>
                <th className="px-4 py-3">Contract #</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Start Date</th>
                <th className="px-4 py-3">Expiry Date</th>
                <th className="px-4 py-3">Payment Terms</th>
                <th className="px-4 py-3 text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D5DDD2]">
              {subscriptions.map((s) => (
                <tr key={s.id} className="hover:bg-[#F3F7F2] transition-colors">
                  <td className="px-4 py-3 font-bold font-mono text-[#1F2622]">
                    <Link href={`/subscriptions/${s.id}`} className="hover:underline">{s.number}</Link>
                  </td>
                  <td className="px-4 py-3 text-[#1F2622]">{s.plan?.name ?? "—"}</td>
                  <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                  <td className="px-4 py-3 font-mono text-xs text-[#657367]">{s.startDate}</td>
                  <td className="px-4 py-3 font-mono text-xs text-[#657367]">{s.expiryDate}</td>
                  <td className="px-4 py-3 uppercase text-xs text-[#657367]">{s.paymentTerms.replace("_", " ")}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/subscriptions/${s.id}`}>
                      <button className="p-1.5 hover:text-[#1F2622] text-[#8C9B8E]"><Eye className="w-4 h-4" /></button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-[#657367] pt-3 gap-3">
          <span>Page {currentPage} of {totalPages} ({total} contracts)</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className={`px-3 py-1.5 ${THEME.secondaryButton} text-xs disabled:opacity-40`}
            >
              Prev
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`w-7 h-7 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors ${
                  currentPage === pageNum
                    ? "bg-[#1F2622] text-white"
                    : "bg-white border border-[#D5DDD2] text-[#1F2622] hover:bg-[#F3F7F2]"
                }`}
              >
                {pageNum}
              </button>
            ))}
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className={`px-3 py-1.5 ${THEME.secondaryButton} text-xs disabled:opacity-40`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
