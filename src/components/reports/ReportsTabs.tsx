"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ReportTab } from "@/types";
import { cn } from "@/lib/utils";

const TABS: { id: ReportTab; label: string }[] = [
  { id: "subscriptions", label: "SUBSCRIPTIONS" },
  { id: "revenue", label: "REVENUE" },
  { id: "payments", label: "PAYMENTS" },
  { id: "invoices", label: "INVOICES" },
];

interface ReportsTabsProps {
  activeTab: ReportTab;
}

export function ReportsTabs({ activeTab }: ReportsTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleTabChange = (tab: ReportTab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    // Reset pagination and sort for the new tab
    params.set("page", "1");
    params.delete("sort");
    params.delete("dir");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-1 border-b border-[#D5DDD2] pb-0 overflow-x-auto">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTabChange(tab.id)}
            className={cn(
              "relative px-4 py-2 text-xs font-bold tracking-wider transition-all select-none rounded-t-lg border-t border-x",
              isActive
                ? "bg-white text-[#1F2622] border-[#D5DDD2] border-b-transparent -mb-[1px] z-10 shadow-sm"
                : "bg-[#EBF1EA]/60 text-[#8C9B8E] border-transparent hover:text-[#1F2622] hover:bg-[#EBF1EA]"
            )}
          >
            {/* Active orange marker indicator */}
            {isActive && (
              <span className="absolute -top-[1px] left-0 right-0 h-[2.5px] bg-[#F27B4B] rounded-t-lg" />
            )}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
