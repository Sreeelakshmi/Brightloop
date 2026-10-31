"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Edit2, Trash2, Search, Plus, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-md border border-input bg-background text-sm shadow-sm"
          />
        </div>
        {isAdmin && (
          <Link href="/products/new">
            <Button size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" /> Add Product
            </Button>
          </Link>
        )}
      </div>

      {deleteError && (
        <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">{deleteError}</div>
      )}

      {error ? (
        <div className="p-8 text-center text-sm text-destructive border rounded-md bg-destructive/5">{error}</div>
      ) : loading ? (
        <div className="p-12 text-center text-sm text-muted-foreground">Loading products catalog...</div>
      ) : products.length === 0 ? (
        <div className="p-12 text-center border border-dashed rounded-md space-y-2">
          <Package className="w-8 h-8 text-muted-foreground mx-auto" />
          <p className="text-sm font-medium">No products found</p>
          <p className="text-xs text-muted-foreground">Try adjusting your search query or add a new product.</p>
        </div>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
              <tr>
                <th className="px-4 py-3">Product Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Sales Price</th>
                <th className="px-4 py-3">Cost Price</th>
                <th className="px-4 py-3">Variants</th>
                {isAdmin && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/products/${p.id}`} className="hover:underline">{p.name}</Link>
                  </td>
                  <td className="px-4 py-3 capitalize text-muted-foreground">{p.type}</td>
                  <td className="px-4 py-3 font-mono">${p.salesPrice.toFixed(2)}</td>
                  <td className="px-4 py-3 font-mono text-muted-foreground">${p.costPrice.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs bg-secondary text-secondary-foreground">
                      {p.variants?.length ?? 0} variants
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-right space-x-1">
                      <Link href={`/products/${p.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Edit2 className="w-4 h-4" /></Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(p.id, p.name)}
                        disabled={deletingId === p.id}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
          <span>Showing page {currentPage} of {totalPages} ({total} total products)</span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage <= 1}>
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
