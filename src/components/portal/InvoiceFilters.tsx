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
              "h-7 px-3 text-[10px] font-bold uppercase tracking-widest rounded-lg border transition-colors font-mono",
              status === opt.value && !overdueOnly
                ? "bg-[#1F2622] text-white border-[#1F2622]"
                : "bg-white text-[#1F2622] border-[#D5DDD2] hover:bg-[#DDE5DB]/60"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-[#D5DDD2] hidden sm:block" />

      {/* Overdue toggle */}
      <button
        type="button"
        onClick={toggleOverdue}
        className={cn(
          "h-7 px-3 text-[10px] font-bold uppercase tracking-widest rounded-lg border transition-colors font-mono flex items-center gap-1.5",
          overdueOnly
            ? "bg-[#F27B4B] text-white border-[#F27B4B]"
            : "bg-white text-[#F27B4B] border-[#F27B4B]/50 hover:bg-[#F27B4B]/10"
        )}
      >
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full",
            overdueOnly ? "bg-white" : "bg-[#F27B4B]"
          )}
        />
        OVERDUE ONLY
      </button>
    </div>
  );
}

