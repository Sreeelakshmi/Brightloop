"use client";

import * as React from "react";
import { Subscription } from "@/types";
import { formatDate, formatMoney } from "@/lib/formatters";

interface RenewalInfoPanelProps {
  subscription: Subscription;
}

export function RenewalInfoPanel({ subscription }: RenewalInfoPanelProps) {
  const isRenewable = subscription.plan?.renewable !== false;
  const billingCycle = subscription.plan?.billingCycle || "monthly";

  return (
    <div className="bg-white border-[1.5px] border-[#B9CBB9] rounded-[3px] p-5 shadow-none">
      <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8A968A] mb-4 pb-2 border-b border-[#B9CBB9]">
        RENEWAL & BILLING TERMS // OVERVIEW
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Next Billing Date */}
        <div className="bg-[#E4EEE4]/30 p-3 rounded-[2px] border border-[#B9CBB9]/60">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8A968A]">
            NEXT BILLING DATE
          </div>
          <div className="text-sm font-mono font-bold text-[#2B302B] mt-1">
            {formatDate(subscription.renewalDate || subscription.endDate)}
          </div>
          <div className="text-[10px] font-mono text-[#8A968A] mt-0.5">
            Automatic schedule
          </div>
        </div>

        {/* Expiry Date */}
        <div className="bg-[#E4EEE4]/30 p-3 rounded-[2px] border border-[#B9CBB9]/60">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8A968A]">
            EXPIRY DATE
          </div>
          <div className="text-sm font-mono font-bold text-[#2B302B] mt-1">
            {formatDate(subscription.endDate)}
          </div>
          <div className="text-[10px] font-mono text-[#8A968A] mt-0.5">
            Contract termination
          </div>
        </div>

        {/* Renewable */}
        <div className="bg-[#E4EEE4]/30 p-3 rounded-[2px] border border-[#B9CBB9]/60">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8A968A]">
            RENEWABLE
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className={`inline-flex items-center px-2 py-0.5 text-xs font-mono font-bold rounded-[2px] ${
                isRenewable
                  ? "bg-[#D3E3D3] text-[#2B302B]"
                  : "bg-[#8A968A]/20 text-[#8A968A]"
              }`}
            >
              {isRenewable ? "YES" : "NO"}
            </span>
          </div>
          <div className="text-[10px] font-mono text-[#8A968A] mt-0.5">
            {isRenewable ? "Self-service extension" : "Plan locked"}
          </div>
        </div>

        {/* Amount per cycle */}
        <div className="bg-[#E4EEE4]/30 p-3 rounded-[2px] border border-[#B9CBB9]/60">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8A968A]">
            AMOUNT PER CYCLE
          </div>
          <div className="text-sm font-mono font-bold text-[#2B302B] mt-1 tabular-nums">
            {formatMoney(subscription.totalAmount)}
          </div>
          <div className="text-[10px] font-mono text-[#8A968A] mt-0.5 capitalize">
            per {billingCycle}
          </div>
        </div>
      </div>
    </div>
  );
}
