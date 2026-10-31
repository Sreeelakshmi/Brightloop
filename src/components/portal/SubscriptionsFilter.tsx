"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const STATUSES = [
  { id: "all", label: "ALL" },
  { id: "active", label: "ACTIVE" },
  { id: "confirmed", label: "CONFIRMED" },
  { id: "quotation", label: "QUOTATION" },
  { id: "draft", label: "DRAFT" },
  { id: "closed", label: "CLOSED" },
];

interface SubscriptionsFilterProps {
  currentStatus: string;
}

export function SubscriptionsFilter({ currentStatus }: SubscriptionsFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSelect = (statusId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (statusId === "all") {
      params.delete("status");
    } else {
      params.set("status", statusId);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white border border-[#D5DDD2] rounded-xl w-fit">
      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8C9B8E] px-2">
        Filter:
      </span>
      {STATUSES.map((s) => {
        const isActive = (currentStatus || "all").toLowerCase() === s.id;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => handleSelect(s.id)}
            className={cn(
              "px-2.5 py-1 text-[11px] font-mono font-bold uppercase tracking-wider rounded-lg transition-colors",
              isActive
                ? "bg-[#1F2622] text-white"
                : "text-[#8C9B8E] hover:text-[#1F2622] hover:bg-[#DDE5DB]/50"
            )}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
