"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = [
  { value: "", label: "ALL" },
  { value: "paid", label: "PAID" },
  { value: "overdue", label: "OVERDUE" },
  { value: "confirmed", label: "CONFIRMED" },
  { value: "draft", label: "DRAFT" },
  { value: "cancelled", label: "CANCELLED" },
];

/**
 * InvoiceFilters
 * URL-synced client filter bar for /portal/invoices.
 * Controls: status chips + "Overdue only" toggle.
 */
export function InvoiceFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const status = searchParams.get("status") ?? "";
  const overdueOnly = searchParams.get("overdue") === "1";
  const page = searchParams.get("page") ?? "1";

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      // Reset to page 1 on filter change
      params.set("page", "1");
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const setStatus = (val: string) => update("status", val);

  const toggleOverdue = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (overdueOnly) {
      params.delete("overdue");
    } else {
      params.set("overdue", "1");
      params.delete("status"); // clear status chip when "overdue only" is on
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Status chips */}
      <div className="flex flex-wrap gap-1.5">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setStatus(opt.value)}
            className={cn(
              "h-7 px-3 text-[10px] font-bold uppercase tracking-widest rounded-[2px] border transition-colors font-mono",
              status === opt.value && !overdueOnly
                ? "bg-[#2B302B] text-white border-[#2B302B]"
                : "bg-white text-[#2B302B] border-[#B9CBB9] hover:bg-[#D3E3D3]/60"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-[#B9CBB9] hidden sm:block" />

      {/* Overdue toggle */}
      <button
        type="button"
        onClick={toggleOverdue}
        className={cn(
          "h-7 px-3 text-[10px] font-bold uppercase tracking-widest rounded-[2px] border transition-colors font-mono flex items-center gap-1.5",
          overdueOnly
            ? "bg-[#F57B4A] text-white border-[#F57B4A]"
            : "bg-white text-[#F57B4A] border-[#F57B4A]/50 hover:bg-[#F57B4A]/10"
        )}
      >
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full",
            overdueOnly ? "bg-white" : "bg-[#F57B4A]"
          )}
        />
        OVERDUE ONLY
      </button>
    </div>
  );
}

