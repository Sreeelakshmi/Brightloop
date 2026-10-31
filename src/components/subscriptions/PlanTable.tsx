"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Edit2, Trash2, Search, Plus, Layers } from "lucide-react";
import { THEME } from "./theme";
import { deletePlanAction } from "@/app/(dashboard)/plans/actions";
import type { PlanWithId } from "@/types/catalog";
import type { UserRole } from "@/types";

interface PlanTableProps {
  plans: PlanWithId[];
  total: number;
  currentPage: number;
  pageSize?: number;
  role: UserRole;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onPageChange: (p: number) => void;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

export function PlanTable({
  plans,
  total,
  currentPage,
  pageSize = 20,
  role,
  searchQuery,
  onSearchChange,
  onPageChange,
  loading = false,
  error = null,
  onRefresh,
}: PlanTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const isAdmin = role === "admin" || role === "owner";
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete plan "${name}"?`)) return;
    setDeletingId(id);
    setDeleteError(null);
    try {
      const res = await deletePlanAction(id);
      if (!res.success) {
        setDeleteError(res.error ?? "Failed to delete plan.");
      } else if (onRefresh) {
        onRefresh();
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#8C9B8E]" />
          <input
            type="text"
            placeholder="Search plans..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className={`w-full pl-9 ${THEME.input}`}
          />
        </div>
        {isAdmin && (
          <Link href="/plans/new">
            <button className={`px-4 py-2 ${THEME.primaryDark.button} flex items-center gap-1.5 text-xs tracking-wider whitespace-nowrap`}>
              <Plus className="w-4 h-4" /> Add Plan
            </button>
          </Link>
        )}
      </div>

      {deleteError && (
        <div className="p-3 bg-[#FDEEE7] text-[#D95522] border border-[#F27B4B] text-sm rounded-xl">{deleteError}</div>
      )}

      {error ? (
        <div className="p-8 text-center text-sm text-[#D95522] border border-[#F27B4B] rounded-xl bg-[#FDEEE7]">{error}</div>
      ) : loading ? (
        <div className="p-12 text-center text-sm text-[#657367]">Loading pricing plans...</div>
      ) : plans.length === 0 ? (
        <div className={`p-12 text-center ${THEME.card} border-dashed space-y-2`}>
          <Layers className="w-8 h-8 text-[#8C9B8E] mx-auto" />
          <p className="text-sm font-bold uppercase text-[#1F2622]">No plans found</p>
          <p className="text-xs text-[#657367]">Try adjusting your search query or add a new pricing plan.</p>
        </div>
      ) : (
        <div className={THEME.tableWrapper}>
          <table className="w-full text-sm text-left">
            <thead className={THEME.mutedSage.tableHeader}>
              <tr>
                <th className="px-4 py-3">Plan Name</th>
                <th className="px-4 py-3">Billing Period</th>
                <th className="px-4 py-3">Base Price</th>
                <th className="px-4 py-3">Min Qty</th>
                <th className="px-4 py-3">Policy Rules</th>
                {isAdmin && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D5DDD2]">
              {plans.map((p) => (
                <tr key={p.id} className="hover:bg-[#F3F7F2] transition-colors">
                  <td className="px-4 py-3 font-semibold text-[#1F2622]">
                    <Link href={`/plans/${p.id}`} className="hover:underline">{p.name}</Link>
                  </td>
                  <td className="px-4 py-3 capitalize text-[#657367]">{p.billingPeriod}</td>
                  <td className="px-4 py-3 font-mono font-medium">${p.price.toFixed(2)}</td>
                  <td className="px-4 py-3 font-mono text-[#657367]">{p.minQuantity}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {p.renewable && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#DDE5DB] text-[#1F2622] uppercase tracking-wider">Renewable</span>
                      )}
                      {p.pausable && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#DDE5DB] text-[#1F2622] uppercase tracking-wider">Pausable</span>
                      )}
                      {p.closable && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#DDE5DB] text-[#1F2622] uppercase tracking-wider">Closable</span>
                      )}
                      {p.autoClose && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FDEEE7] text-[#D95522] border border-[#F27B4B] uppercase tracking-wider">Auto-Close</span>
                      )}
                    </div>
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-right space-x-1">
                      <Link href={`/plans/${p.id}`}>
                        <button className="p-1.5 hover:text-[#1F2622] text-[#8C9B8E]">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </Link>
                      <button
                        onClick={() => handleDelete(p.id, p.name)}
                        disabled={deletingId === p.id}
                        className="p-1.5 hover:text-[#F27B4B] text-[#8C9B8E] transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-[#657367] pt-2">
          <span>Showing page {currentPage} of {totalPages} ({total} total plans)</span>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className={`px-3 py-1.5 ${THEME.secondaryButton} text-xs`}
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className={`px-3 py-1.5 ${THEME.secondaryButton} text-xs`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
