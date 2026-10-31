"use client";

import React from "react";
import { THEME } from "./theme";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  dateBadge?: string;
  logDate?: string;
  actions?: React.ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  dateBadge,
  logDate = "31.10.2026",
  actions,
}: PageHeaderProps) {
  const badgeText = dateBadge ?? (logDate ? `LOG: ${logDate}` : undefined);
  return (
    <div className="space-y-3 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-[#1F2622]">
              {title}
            </h1>
            {/* Hexagon icon matching the Brightloop brand reference */}
            <svg
              className="w-5 h-5 text-[#1F2622] inline-block shrink-0 stroke-[2.5]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <polygon points="12 2 21 7.5 21 16.5 12 22 3 16.5 3 7.5 12 2" />
            </svg>
          </div>
          {(subtitle || badgeText) && (
            <div className="flex items-center gap-2 mt-1">
              {subtitle && (
                <span className="text-xs font-semibold tracking-wider text-[#657367]">
                  {subtitle}
                </span>
              )}
              {badgeText && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[#DDE5DB] text-[#1F2622]">
                  {badgeText}
                </span>
              )}
            </div>
          )}
        </div>

        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>

      {/* Signature 3-segment progress indicator bar */}
      <div className="w-full h-1.5 rounded-full overflow-hidden flex bg-[#D5DDD2]">
        <div className="h-full bg-[#1F2622] w-[45%]" />
        <div className="h-full bg-[#8C9B8E] w-[35%]" />
        <div className="h-full bg-[#F27B4B] w-[20%]" />
      </div>
    </div>
  );
}
