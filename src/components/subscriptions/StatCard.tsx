"use client";

import React from "react";

export type StatCardVariant = "dark" | "sage" | "orange";

interface StatCardProps {
  label: string;
  value: string | number;
  caption?: string;
  variant?: StatCardVariant;
  showHexagon?: boolean;
}

export function StatCard({
  label,
  value,
  caption,
  variant = "sage",
  showHexagon = false,
}: StatCardProps) {
  const headerStyles: Record<StatCardVariant, string> = {
    dark: "bg-[#1F2622] text-white",
    sage: "bg-[#8C9B8E] text-white",
    orange: "bg-[#F27B4B] text-white",
  };

  const valueStyles: Record<StatCardVariant, string> = {
    dark: "text-[#1F2622]",
    sage: "text-[#1F2622]",
    orange: "text-[#F27B4B]",
  };

  return (
    <div className="rounded-xl border border-[#D5DDD2] bg-white overflow-hidden shadow-sm flex flex-col justify-between">
      {/* Top Banner Header Strip */}
      <div className={`px-4 py-2 flex items-center justify-between ${headerStyles[variant]}`}>
        <span className="text-[11px] font-bold uppercase tracking-wider">{label}</span>
        {showHexagon && (
          <svg
            className="w-3.5 h-3.5 stroke-[2.5]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <polygon points="12 2 21 7.5 21 16.5 12 22 3 16.5 3 7.5 12 2" />
          </svg>
        )}
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col justify-center">
        <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${valueStyles[variant]}`}>
          {value}
        </div>
        {caption && (
          <div className="text-xs text-[#657367] mt-1 font-medium">{caption}</div>
        )}
      </div>
    </div>
  );
}

