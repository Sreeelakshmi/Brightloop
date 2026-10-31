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
    <div className="flex items-center gap-1.5 border-b-[1.5px] border-[#B9CBB9] pb-0 overflow-x-auto">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTabChange(tab.id)}
            className={cn(
              "relative px-4 py-2 text-xs font-mono font-bold tracking-wider transition-all select-none rounded-t-[3px] border-t-[1.5px] border-x-[1.5px]",
              isActive
                ? "bg-white text-[#2B302B] border-[#B9CBB9] border-b-transparent -mb-[1.5px] z-10"
                : "bg-[#D3E3D3]/40 text-[#8A968A] border-transparent hover:text-[#2B302B] hover:bg-[#D3E3D3]/70"
            )}
          >
            {/* Active orange marker indicator */}
            {isActive && (
              <span className="absolute -top-[1.5px] left-0 right-0 h-[2.5px] bg-[#F57B4A] rounded-t-[2px]" />
            )}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
