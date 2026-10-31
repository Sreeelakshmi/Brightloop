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
    <div className="bg-white border border-[#D5DDD2] rounded-xl p-5 shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#D5DDD2]">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#1F2622]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#1F2622]">
            UPCOMING RENEWALS
          </h3>
        </div>
        <Link
          href="/portal/subscriptions"
          className="text-xs font-semibold text-[#8C9B8E] hover:text-[#1F2622] flex items-center gap-1 transition-colors"
        >
          View all <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {upcoming.length === 0 ? (
        <div className="py-8 text-center text-xs text-[#8C9B8E]">
          No active subscriptions scheduled for renewal.
        </div>
      ) : (
        <div className="relative pl-4 space-y-4 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[1.5px] before:bg-[#D5DDD2]">
          {upcoming.map((sub, index) => {
            const isFirst = index === 0;
            return (
              <div key={sub.id} className="relative group">
                {/* Timeline Node */}
                <div
                  className={`absolute -left-[13px] top-3.5 w-3 h-3 rounded-full border-2 transition-colors ${
                    isFirst
                      ? "bg-[#F27B4B] border-[#F27B4B]"
                      : "bg-white border-[#1F2622] group-hover:bg-[#1F2622]"
                  }`}
                />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#EBF1EA]/40 hover:bg-[#EBF1EA] p-3 rounded-xl border border-[#D5DDD2] transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#1F2622]">
                        {sub.subscriptionNumber || sub.number || sub.id}
                      </span>
                      <StatusBadge status={sub.status || "draft"} />
                    </div>
                    <div className="text-xs font-semibold text-[#1F2622] mt-0.5">
                      {sub.plan?.name || "Standard Plan"}
                    </div>
                  </div>

                  <div className="flex items-center sm:text-right gap-4">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-[#8C9B8E]">
                        Renewal Date
                      </div>
                      <div className="text-xs font-semibold text-[#1F2622]">
                        {formatDate(sub.renewalDate || sub.endDate || sub.startDate)}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] uppercase font-bold text-[#8C9B8E]">
                        Amount
                      </div>
                      <div className="text-xs font-bold text-[#1F2622]">
                        {formatMoney(sub.totalAmount ?? 0)}
                      </div>
                    </div>

                    <Link
                      href={`/portal/subscriptions/${sub.id}`}
                      className="h-7 px-3 text-xs font-semibold border border-[#D5DDD2] rounded-lg bg-white text-[#1F2622] hover:bg-[#EBF1EA] transition-colors inline-flex items-center"
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
