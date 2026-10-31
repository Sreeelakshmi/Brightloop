"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Edit2, Trash2, Plus, Package } from "lucide-react";
import { THEME } from "./theme";
import { FilterBar } from "./FilterBar";
import { deleteProductAction } from "@/app/(dashboard)/products/actions";
import type { ProductWithVariants } from "@/types/catalog";
import type { UserRole } from "@/types";

interface ProductTableProps {
  products: ProductWithVariants[];
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

export function ProductTable({
  products,
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
}: ProductTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const isAdmin = role === "admin" || role === "owner";
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete product "${name}"?`)) return;
    setDeletingId(id);
    setDeleteError(null);
    try {
      const res = await deleteProductAction(id);
      if (!res.success) {
        setDeleteError(res.error ?? "Failed to delete product.");
      } else if (onRefresh) {
        onRefresh();
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        searchPlaceholder="Search catalog products..."
        onReset={() => onSearchChange("")}
        actionButton={
          isAdmin ? (
            <Link href="/products/new">
              <button className={`px-4 py-2 ${THEME.primaryDark.button} flex items-center gap-1.5 text-xs uppercase tracking-wider whitespace-nowrap`}>
                <Plus className="w-4 h-4" /> Add Product
              </button>
            </Link>
          ) : undefined
        }
      />

      {deleteError && (
        <div className="p-3 bg-[#FDEEE7] text-[#D95522] border border-[#F27B4B] text-sm rounded-xl">{deleteError}</div>
      )}

      {error ? (
        <div className="p-8 text-center text-sm text-[#D95522] border border-[#F27B4B] rounded-xl bg-[#FDEEE7]">{error}</div>
      ) : loading ? (
        <div className="p-12 text-center text-sm text-[#657367]">Loading products catalog...</div>
      ) : products.length === 0 ? (
        <div className={`p-12 text-center ${THEME.card} border-dashed space-y-2`}>
          <Package className="w-8 h-8 text-[#8C9B8E] mx-auto" />
          <p className="text-sm font-bold uppercase text-[#1F2622]">No products found</p>
          <p className="text-xs text-[#657367]">Try adjusting your search query or add a new product.</p>
        </div>
      ) : (
        <div className={THEME.tableWrapper}>
          <table className="w-full text-sm text-left">
            <thead className={THEME.mutedSage.tableHeader}>
              <tr>
                <th className="px-4 py-3">Product Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Sales Price</th>
                <th className="px-4 py-3">Cost Price</th>
                <th className="px-4 py-3">Variants</th>
                {isAdmin && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D5DDD2]">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-[#F3F7F2] transition-colors">
                  <td className="px-4 py-3 font-semibold text-[#1F2622]">
                    <Link href={`/products/${p.id}`} className="hover:underline">{p.name}</Link>
                  </td>
                  <td className="px-4 py-3 capitalize text-[#657367]">{p.type}</td>
                  <td className="px-4 py-3 font-mono font-medium">${p.salesPrice.toFixed(2)}</td>
                  <td className="px-4 py-3 font-mono text-[#657367]">${p.costPrice.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] bg-[#DDE5DB] text-[#1F2622] font-semibold uppercase tracking-wider">
                      {p.variants?.length ?? 0} variants
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-right space-x-1">
                      <Link href={`/products/${p.id}`}>
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
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-[#657367] pt-3 gap-3">
          <span>Showing page {currentPage} of {totalPages} ({total} total products)</span>
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
