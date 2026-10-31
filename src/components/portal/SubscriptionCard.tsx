"use client";

import * as React from "react";
import Link from "next/link";
import { Subscription } from "@/types";
import { StatusBadge } from "@/components/ui-shared";
import { formatDate, formatMoney } from "@/lib/formatters";
import { ArrowUpRight } from "lucide-react";

interface SubscriptionCardProps {
  subscription: Subscription;
}

export function SubscriptionCard({ subscription }: SubscriptionCardProps) {
  // Calculate a proportional billing-term progress based on start and end dates
  const now = new Date().getTime();
  const start = new Date(subscription.startDate || 0).getTime();
  const endDateStr = subscription.endDate || subscription.expiryDate || subscription.renewalDate || subscription.startDate;
  const end = new Date(endDateStr || 0).getTime();
  const totalDuration = Math.max(1, end - start);
  const elapsed = Math.min(Math.max(0, now - start), totalDuration);
  const percentElapsed = Math.round((elapsed / totalDuration) * 100);

  const segment1 = Math.min(percentElapsed, 70);
  const segment2 = Math.min(Math.max(0, percentElapsed - 70), 20);
  const segment3 = Math.max(0, 100 - segment1 - segment2);

  return (
    <div className="bg-white border border-[#D5DDD2] rounded-xl p-5 shadow-none flex flex-col justify-between hover:border-[#1F2622] transition-all group">
      <div>
        {/* Top Header: Subscription Number & Status Badge */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="font-mono text-xs font-bold text-[#1F2622] tracking-tight">
            {subscription.subscriptionNumber || subscription.number || subscription.id}
          </span>
          <StatusBadge status={subscription.status || "draft"} />
        </div>

        {/* Plan Name */}
        <h3 className="text-base font-extrabold text-[#1F2622] mb-2 tracking-tight">
          {subscription.plan?.name || "Standard Subscription"}
        </h3>

        {/* Mini Three-Segment Billing-Term Progress Line */}
        <div className="space-y-1 mb-4">
          <div className="flex justify-between text-[10px] font-mono text-[#8C9B8E] uppercase">
            <span>Billing Term</span>
            <span>{percentElapsed}% Elapsed</span>
          </div>
          <div className="h-1.5 w-full flex rounded-[1px] overflow-hidden gap-[1px] bg-[#E4ECE1]">
            <div
              className="h-full bg-[#1F2622] transition-all"
              style={{ width: `${segment1}%` }}
            />
            <div
              className="h-full bg-[#8C9B8E] transition-all"
              style={{ width: `${segment2}%` }}
            />
            <div
              className="h-full bg-[#F27B4B] transition-all"
              style={{ width: `${segment3}%` }}
            />
          </div>
        </div>

        {/* 2x2 Grid with Uppercase Labels */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#D5DDD2]/60 mb-5">
          <div>
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8C9B8E]">
              START DATE
            </div>
            <div className="text-xs font-mono font-semibold text-[#1F2622] mt-0.5">
              {formatDate(subscription.startDate)}
            </div>
          </div>

          <div>
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8C9B8E]">
              EXPIRY DATE
            </div>
            <div className="text-xs font-mono font-semibold text-[#1F2622] mt-0.5">
              {formatDate(endDateStr)}
            </div>
          </div>

          <div>
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8C9B8E]">
              NEXT BILLING
            </div>
            <div className="text-xs font-mono font-semibold text-[#1F2622] mt-0.5">
              {formatDate(subscription.renewalDate || subscription.nextBillingDate || endDateStr)}
            </div>
          </div>

          <div>
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8C9B8E]">
              AMOUNT
            </div>
            <div className="text-xs font-mono font-bold text-[#1F2622] mt-0.5 tabular-nums">
              {formatMoney(subscription.totalAmount ?? 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Action: View Details Button */}
      <Link
        href={`/portal/subscriptions/${subscription.id}`}
        className="w-full h-8 px-3 text-xs font-mono font-semibold border border-[#D5DDD2] rounded-lg bg-white text-[#1F2622] hover:bg-[#1F2622] hover:text-white hover:border-[#1F2622] transition-colors flex items-center justify-between"
      >
        <span>View details</span>
        <ArrowUpRight className="w-3.5 h-3.5 opacity-80" />
      </Link>
    </div>
  );
}
