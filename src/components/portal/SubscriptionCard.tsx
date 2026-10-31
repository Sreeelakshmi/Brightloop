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
    <div className="bg-white border-[1.5px] border-[#B9CBB9] rounded-[3px] p-5 shadow-none flex flex-col justify-between hover:border-[#2B302B] transition-all group">
      <div>
        {/* Top Header: Subscription Number & Status Badge */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="font-mono text-xs font-bold text-[#2B302B] tracking-tight">
            {subscription.subscriptionNumber || subscription.number || subscription.id}
          </span>
          <StatusBadge status={subscription.status || "draft"} />
        </div>

        {/* Plan Name */}
        <h3 className="text-base font-extrabold text-[#2B302B] mb-2 tracking-tight">
          {subscription.plan?.name || "Standard Subscription"}
        </h3>

        {/* Mini Three-Segment Billing-Term Progress Line */}
        <div className="space-y-1 mb-4">
          <div className="flex justify-between text-[10px] font-mono text-[#8A968A] uppercase">
            <span>Billing Term</span>
            <span>{percentElapsed}% Elapsed</span>
          </div>
          <div className="h-1.5 w-full flex rounded-[1px] overflow-hidden gap-[1px] bg-[#E4EEE4]">
            <div
              className="h-full bg-[#2B302B] transition-all"
              style={{ width: `${segment1}%` }}
            />
            <div
              className="h-full bg-[#8A968A] transition-all"
              style={{ width: `${segment2}%` }}
            />
            <div
              className="h-full bg-[#F57B4A] transition-all"
              style={{ width: `${segment3}%` }}
            />
          </div>
        </div>

        {/* 2x2 Grid with Uppercase Labels */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#B9CBB9]/60 mb-5">
          <div>
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8A968A]">
              START DATE
            </div>
            <div className="text-xs font-mono font-semibold text-[#2B302B] mt-0.5">
              {formatDate(subscription.startDate)}
            </div>
          </div>

          <div>
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8A968A]">
              EXPIRY DATE
            </div>
            <div className="text-xs font-mono font-semibold text-[#2B302B] mt-0.5">
              {formatDate(endDateStr)}
            </div>
          </div>

          <div>
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8A968A]">
              NEXT BILLING
            </div>
            <div className="text-xs font-mono font-semibold text-[#2B302B] mt-0.5">
              {formatDate(subscription.renewalDate || subscription.nextBillingDate || endDateStr)}
            </div>
          </div>

          <div>
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8A968A]">
              AMOUNT
            </div>
            <div className="text-xs font-mono font-bold text-[#2B302B] mt-0.5 tabular-nums">
              {formatMoney(subscription.totalAmount ?? 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Action: View Details Button */}
      <Link
        href={`/portal/subscriptions/${subscription.id}`}
        className="w-full h-8 px-3 text-xs font-mono font-semibold border-[1.5px] border-[#B9CBB9] rounded-[2px] bg-white text-[#2B302B] hover:bg-[#2B302B] hover:text-white hover:border-[#2B302B] transition-colors flex items-center justify-between"
      >
        <span>View details</span>
        <ArrowUpRight className="w-3.5 h-3.5 opacity-80" />
      </Link>
    </div>
  );
}
