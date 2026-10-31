"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Plus, Edit2, Trash2, FileSpreadsheet } from "lucide-react";
import { THEME } from "./theme";
import { FilterBar } from "./FilterBar";
import { deleteTemplateAction } from "@/app/(dashboard)/quotations/actions";
import type { QuotationTemplateWithDetails } from "@/types/subscription-services";
import type { UserRole } from "@/types";

interface TemplateTableProps {
  templates: QuotationTemplateWithDetails[];
  total: number;
  currentPage: number;
  pageSize?: number;
  role: UserRole;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onPageChange: (p: number) => void;
  onRefresh?: () => void;
}

export function TemplateTable({
  templates,
  total,
  currentPage,
  pageSize = 20,
  role,
  searchQuery,
  onSearchChange,
  onPageChange,
  onRefresh,
}: TemplateTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const isAdmin = role === "admin" || role === "owner";
  const canEdit = role !== "customer";
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete template "${name}"?`)) return;
    setDeletingId(id);
    setDeleteError(null);
    try {
      const res = await deleteTemplateAction(id);
      if (!res.success) setDeleteError(res.error ?? "Failed to delete template.");
      else if (onRefresh) onRefresh();
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        searchPlaceholder="Search proposal templates..."
        onReset={() => onSearchChange("")}
        actionButton={
          canEdit ? (
            <Link href="/quotations/new">
              <button className={`px-4 py-2 ${THEME.primaryDark.button} flex items-center gap-1.5 text-xs uppercase tracking-wider whitespace-nowrap`}>
                <Plus className="w-4 h-4" /> New Template
              </button>
            </Link>
          ) : undefined
        }
      />

      {deleteError && (
        <div className="p-3 rounded-xl bg-[#FDEEE7] text-[#D95522] text-sm border border-[#F27B4B]">{deleteError}</div>
      )}

      {templates.length === 0 ? (
        <div className={`p-12 text-center ${THEME.card} border-dashed`}>
          <FileSpreadsheet className="w-10 h-10 text-[#8C9B8E] mx-auto mb-2" />
          <p className="font-bold uppercase text-sm text-[#1F2622]">No quotation templates found</p>
          <p className="text-xs text-[#657367]">Templates allow one-click creation of standardized subscription contracts.</p>
        </div>
      ) : (
        <div className={THEME.tableWrapper}>
          <table className="w-full text-sm text-left">
            <thead className={THEME.mutedSage.tableHeader}>
              <tr>
                <th className="px-4 py-3">Template Name</th>
                <th className="px-4 py-3">Associated Plan</th>
                <th className="px-4 py-3">Validity</th>
                <th className="px-4 py-3">Line Items</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D5DDD2]">
              {templates.map((t) => (
                <tr key={t.id} className="hover:bg-[#F3F7F2] transition-colors">
                  <td className="px-4 py-3 font-semibold text-[#1F2622]">
                    <Link href={`/quotations/${t.id}`} className="hover:underline">{t.name}</Link>
                  </td>
                  <td className="px-4 py-3 text-[#657367]">{t.plan?.name ?? "—"}</td>
                  <td className="px-4 py-3 font-mono">{t.validityDays} days</td>
                  <td className="px-4 py-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] bg-[#DDE5DB] text-[#1F2622] font-semibold uppercase tracking-wider">
                      {t.lines?.length ?? 0} items
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-1">
                    {canEdit && (
                      <Link href={`/quotations/${t.id}`}>
                        <button className="p-1.5 hover:text-[#1F2622] text-[#8C9B8E]"><Edit2 className="w-4 h-4" /></button>
                      </Link>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(t.id, t.name)}
                        disabled={deletingId === t.id}
                        className="p-1.5 hover:text-[#F27B4B] text-[#8C9B8E] transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-[#657367] pt-3 gap-3">
          <span>Page {currentPage} of {totalPages} ({total} templates)</span>
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
