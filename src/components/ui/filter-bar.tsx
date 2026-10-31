import React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, Download, RotateCcw } from "lucide-react";

export interface FilterBarProps {
  className?: string;
  onExport?: () => void;
  onReset?: () => void;
}

export function FilterBar({ className, onExport, onReset }: FilterBarProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 p-2 rounded-lg bg-white/70 border border-border backdrop-blur-sm shadow-subtle text-xs text-brightloop-text mb-6",
        className
      )}
    >
      {/* Left controls: Select pills */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Date preset selector */}
        <div className="flex items-center rounded-md border border-border bg-white px-3 py-1.5 shadow-subtle font-medium">
          <span className="text-brightloop-sage mr-1.5">Date preset</span>
          <span className="font-semibold text-brightloop-text">This month</span>
        </div>

        {/* Dropdown Filters */}
        {["Customer", "Plan", "Status", "Payment method"].map((filter) => (
          <button
            key={filter}
            type="button"
            className="flex items-center gap-1.5 rounded-md border border-border bg-white px-3 py-1.5 shadow-subtle hover:bg-brightloop-bg/40 font-medium transition-colors"
          >
            <span>{filter}</span>
            <ChevronDown className="w-3.5 h-3.5 text-brightloop-sage" />
          </button>
        ))}

        {/* Reset Action */}
        <button
          type="button"
          onClick={onReset}
          className="text-brightloop-sage hover:text-brightloop-text font-medium px-2 py-1 transition-colors flex items-center gap-1"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Right controls: View Toggle & Export */}
      <div className="flex items-center gap-3">
        {/* Summary / Detailed pill */}
        <div className="hidden sm:flex items-center gap-2 px-2 text-xs font-semibold text-brightloop-sage">
          <span className="w-7 h-4 rounded-full bg-brightloop-sage/50 relative inline-flex items-center p-0.5 cursor-pointer">
            <span className="w-3 h-3 rounded-full bg-white shadow-sm inline-block translate-x-3 transition-transform" />
          </span>
          <span className="text-brightloop-text">Summary / Detailed</span>
        </div>

        {/* Dark Export Button */}
        <button
          type="button"
          onClick={onExport}
          className="flex items-center gap-1.5 rounded-md bg-brightloop-dark text-white hover:bg-brightloop-dark/90 px-3.5 py-1.5 font-bold uppercase tracking-wider text-[11px] shadow-sm transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </button>
      </div>
    </div>
  );
}

