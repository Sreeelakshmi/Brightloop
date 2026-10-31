"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { cn } from "@/lib/utils";

const METHOD_OPTIONS = [
  { value: "", label: "ALL" },
  { value: "direct_debit", label: "DIRECT DEBIT" },
  { value: "credit_card", label: "CREDIT CARD" },
  { value: "wire_transfer", label: "WIRE TRANSFER" },
  { value: "upi", label: "UPI" },
];

/**
 * PaymentMethodFilter
 * URL-synced client filter bar for /portal/payments.
 */
export function PaymentMethodFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const method = searchParams.get("method") ?? "";

  const setMethod = useCallback(
    (val: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (val) {
        params.set("method", val);
      } else {
        params.delete("method");
      }
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  return (
    <div className="flex flex-wrap gap-1.5">
      {METHOD_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => setMethod(opt.value)}
          className={cn(
            "h-7 px-3 text-[10px] font-bold uppercase tracking-widest rounded-lg border transition-colors font-mono",
            method === opt.value
              ? "bg-[#1F2622] text-white border-[#1F2622]"
              : "bg-white text-[#1F2622] border-[#D5DDD2] hover:bg-[#DDE5DB]/60"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

