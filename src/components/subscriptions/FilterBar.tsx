"use client";

import React from "react";
import { Search } from "lucide-react";
import { THEME } from "./theme";

interface FilterBarProps {
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  searchPlaceholder?: string;
  children?: React.ReactNode;
  onReset?: () => void;
  actionButton?: React.ReactNode;
}

export function FilterBar({
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search...",
  children,
  onReset,
  actionButton,
}: FilterBarProps) {
  return (
    <div className="bg-white border border-[#D5DDD2] rounded-xl p-3.5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
      {/* Left controls: search + dropdown filters */}
      <div className="flex flex-wrap items-center gap-2.5 flex-1">
        {onSearchChange !== undefined && (
          <div className="relative min-w-[200px] max-w-xs flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#8C9B8E]" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery ?? ""}
              onChange={(e) => onSearchChange(e.target.value)}
              className={`w-full pl-9 ${THEME.input}`}
            />
          </div>
        )}

        {children}
      </div>

      {/* Right controls: Reset and Actions */}
      <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-semibold uppercase tracking-wider text-[#657367] hover:text-[#1F2622] transition-colors underline"
          >
            Reset
          </button>
        )}

        {actionButton}
      </div>
    </div>
  );
}

