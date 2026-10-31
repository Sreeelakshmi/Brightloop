"use client";

import * as React from "react";
import Link from "next/link";
import { Subscription } from "@/types";
import { StatusBadge } from "@/components/ui-shared";
import { formatDate, formatMoney } from "@/lib/formatters";
import { Calendar, ArrowRight } from "lucide-react";

interface UpcomingRenewalsTimelineProps {
  subscriptions: Subscription[];
}

export function UpcomingRenewalsTimeline({
  subscriptions,
}: UpcomingRenewalsTimelineProps) {
  // Take next upcoming renewals sorted by renewal date
  const upcoming = [...subscriptions]
    .filter((s) => s.status === "active" || s.status === "confirmed")
    .sort(
      (a, b) =>
        new Date(a.renewalDate || a.endDate || a.startDate || 0).getTime() -
        new Date(b.renewalDate || b.endDate || b.startDate || 0).getTime()
    )
    .slice(0, 5);

  return (
    <div className="bg-white border-[1.5px] border-[#B9CBB9] rounded-[3px] p-5 shadow-none flex flex-col justify-between">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#B9CBB9]">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#2B302B]" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#2B302B]">
            Upcoming Renewals
          </h3>
        </div>
        <Link
          href="/portal/subscriptions"
          className="text-[11px] font-mono font-semibold text-[#8A968A] hover:text-[#2B302B] flex items-center gap-1 transition-colors"
        >
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {upcoming.length === 0 ? (
        <div className="py-8 text-center text-xs font-mono text-[#8A968A]">
          No active subscriptions scheduled for renewal.
        </div>
      ) : (
        <div className="relative pl-4 space-y-6 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[1.5px] before:bg-[#B9CBB9]">
          {upcoming.map((sub, index) => {
            const isFirst = index === 0;
            return (
              <div key={sub.id} className="relative group">
                {/* Timeline Node - Hexagon/Diamond shape */}
                <div
                  className={`absolute -left-[14px] top-1 w-3 h-3 rounded-[1px] rotate-45 border-[1.5px] transition-colors ${
                    isFirst
                      ? "bg-[#F57B4A] border-[#F57B4A]"
                      : "bg-white border-[#2B302B] group-hover:bg-[#2B302B]"
                  }`}
                />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#E4EEE4]/30 hover:bg-[#E4EEE4]/60 p-2.5 rounded-[2px] border border-[#B9CBB9]/60 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#2B302B]">
                        {sub.subscriptionNumber || sub.number || sub.id}
                      </span>
                      <StatusBadge status={sub.status || "draft"} />
                    </div>
                    <div className="text-xs font-medium text-[#2B302B] mt-0.5">
                      {sub.plan?.name || "Standard Plan"}
                    </div>
                  </div>

                  <div className="flex items-center sm:text-right gap-4">
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-wider text-[#8A968A]">
                        Renewal Date
                      </div>
                      <div className="text-xs font-mono font-bold text-[#2B302B]">
                        {formatDate(sub.renewalDate || sub.endDate || sub.startDate)}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-wider text-[#8A968A]">
                        Amount
                      </div>
                      <div className="text-xs font-mono font-bold text-[#2B302B]">
                        {formatMoney(sub.totalAmount ?? 0)}
                      </div>
                    </div>

                    <Link
                      href={`/portal/subscriptions/${sub.id}`}
                      className="h-7 px-2.5 text-[11px] font-mono font-semibold border-[1.5px] border-[#B9CBB9] rounded-[2px] bg-white text-[#2B302B] hover:bg-[#D3E3D3]/60 hover:border-[#2B302B] transition-colors inline-flex items-center"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
