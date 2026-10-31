"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Edit2, Trash2, Search, Plus, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
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
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search plans..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-md border border-input bg-background text-sm shadow-sm"
          />
        </div>
        {isAdmin && (
          <Link href="/plans/new">
            <Button size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" /> Add Plan
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
        <div className="p-12 text-center text-sm text-muted-foreground">Loading plans catalog...</div>
      ) : plans.length === 0 ? (
        <div className="p-12 text-center border border-dashed rounded-md space-y-2">
          <Layers className="w-8 h-8 text-muted-foreground mx-auto" />
          <p className="text-sm font-medium">No plans found</p>
          <p className="text-xs text-muted-foreground">Try adjusting your search query or add a new pricing plan.</p>
        </div>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
              <tr>
                <th className="px-4 py-3">Plan Name</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Billing Period</th>
                <th className="px-4 py-3">Min Qty</th>
                <th className="px-4 py-3">Features</th>
                {isAdmin && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y">
              {plans.map((p) => (
                <tr key={p.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/plans/${p.id}`} className="hover:underline">{p.name}</Link>
                  </td>
                  <td className="px-4 py-3 font-mono">${p.price.toFixed(2)}</td>
                  <td className="px-4 py-3 capitalize">{p.billingPeriod}</td>
                  <td className="px-4 py-3">{p.minQuantity}</td>
                  <td className="px-4 py-3 text-xs space-x-1">
                    {p.renewable && <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">Renew</span>}
                    {p.pausable && <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">Pause</span>}
                    {p.closable && <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800">Close</span>}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-right space-x-1">
                      <Link href={`/plans/${p.id}`}>
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
          <span>Showing page {currentPage} of {totalPages} ({total} total plans)</span>
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
