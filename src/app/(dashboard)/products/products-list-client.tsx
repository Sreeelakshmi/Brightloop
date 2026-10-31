"use client";

import React, { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProductTable } from "@/components/subscriptions/ProductTable";
import type { ProductWithVariants } from "@/types/catalog";
import type { UserRole } from "@/types";

interface ProductsListClientProps {
  initialProducts: ProductWithVariants[];
  total: number;
  currentPage: number;
  pageSize: number;
  role: UserRole;
  initialSearch?: string;
}

export function ProductsListClient({
  initialProducts,
  total,
  currentPage,
  pageSize,
  role,
  initialSearch = "",
}: ProductsListClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(initialSearch);
  const [isPending, startTransition] = useTransition();

  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch);
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (newSearch.trim()) {
        params.set("search", newSearch.trim());
      } else {
        params.delete("search");
      }
      params.set("page", "1");
      router.push(`/products?${params.toString()}`);
    });
  };

  const handlePageChange = (newPage: number) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(newPage));
      router.push(`/products?${params.toString()}`);
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Products Catalog</h1>
        <p className="text-sm text-muted-foreground">
          Manage digital goods, services, and multi-tier product variants.
        </p>
      </div>

      <ProductTable
        products={initialProducts}
        total={total}
        currentPage={currentPage}
        pageSize={pageSize}
        role={role}
        searchQuery={search}
        onSearchChange={handleSearchChange}
        onPageChange={handlePageChange}
        loading={isPending}
        onRefresh={() => router.refresh()}
      />
    </div>
  );
}
