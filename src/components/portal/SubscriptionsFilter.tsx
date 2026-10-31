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
    <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white border-[1.5px] border-[#B9CBB9] rounded-[3px] w-fit">
      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8A968A] px-2">
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
              "px-2.5 py-1 text-[11px] font-mono font-bold uppercase tracking-wider rounded-[2px] transition-colors",
              isActive
                ? "bg-[#2B302B] text-white"
                : "text-[#8A968A] hover:text-[#2B302B] hover:bg-[#D3E3D3]/50"
            )}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
