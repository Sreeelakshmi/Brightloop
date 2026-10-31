import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DateRangePicker, DatePreset } from "./DateRangePicker";
import { Download, RotateCcw } from "lucide-react";

export interface FilterState {
  datePreset: DatePreset;
  customer?: string;
  plan?: string;
  status?: string;
  paymentMethod?: string;
  viewMode?: "summary" | "detailed";
}

export interface FilterBarProps {
  filters?: FilterState;
  onFilterChange?: (filters: FilterState) => void;
  onReset?: () => void;
  onExportCsv?: () => void;
  customerOptions?: string[];
  planOptions?: string[];
  statusOptions?: string[];
  paymentMethodOptions?: string[];
  className?: string;
}

/**
 * FilterBar Component
 * Complete telemetry filter bar matching the reference interface:
 * Date preset, customer, plan, status, payment method filters, reset, summary/detailed toggle, and CSV export.
 */
export function FilterBar({
  filters = {
    datePreset: "This month",
    customer: "all",
    plan: "all",
    status: "all",
    paymentMethod: "all",
    viewMode: "summary",
  },
  onFilterChange,
  onReset,
  onExportCsv,
  customerOptions = ["All Customers", "AeroGroup", "Nexus Logistics", "OmniCorp", "Veloce Systems"],
  planOptions = ["All Plans", "Enterprise Annual", "Pro Monthly", "Standard Tier"],
  statusOptions = ["All Statuses", "Active", "Confirmed", "Quotation", "Draft", "Overdue", "Closed"],
  paymentMethodOptions = ["All Methods", "Direct Debit", "Credit Card", "Wire Transfer", "UPI"],
  className,
}: FilterBarProps) {
  const [localFilters, setLocalFilters] = React.useState<FilterState>(filters);

  const updateField = (key: keyof FilterState, val: any) => {
    const updated = { ...localFilters, [key]: val };
    setLocalFilters(updated);
    onFilterChange?.(updated);
  };

  const handleReset = () => {
    const resetValues: FilterState = {
      datePreset: "This month",
      customer: "all",
      plan: "all",
      status: "all",
      paymentMethod: "all",
      viewMode: "summary",
    };
    setLocalFilters(resetValues);
    onReset?.();
    onFilterChange?.(resetValues);
  };

  return (
    <div
      className={cn(
        "bg-white border-[1.5px] border-[#B9CBB9] rounded-[3px] p-2.5 sm:p-3 flex flex-wrap items-center justify-between gap-3 shadow-none",
        className
      )}
    >
      {/* Left side filters */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {/* Date Preset */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#8A968A] font-bold">
            Date preset:
          </span>
          <DateRangePicker
            value={{
              preset: localFilters.datePreset,
              from: "2026-10-01",
              to: "2026-10-31",
            }}
            onChange={(v) => updateField("datePreset", v.preset)}
          />
        </div>

        {/* Customer Dropdown */}
        <div className="relative">
          <select
            value={localFilters.customer || "all"}
            onChange={(e) => updateField("customer", e.target.value)}
            className="h-8 pl-2.5 pr-6 bg-white border-[1.5px] border-[#B9CBB9] rounded-[3px] text-xs font-semibold text-[#2B302B] hover:bg-[#D3E3D3]/30 focus:outline-none focus:border-[#2B302B] appearance-none cursor-pointer"
          >
            {customerOptions.map((c) => (
              <option key={c} value={c.toLowerCase().replace(/\s+/g, "-")}>
                {c === "All Customers" ? "Customer" : c}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-2 top-2.5 text-[9px] text-[#8A968A]">
            ▼
          </span>
        </div>

        {/* Plan Dropdown */}
        <div className="relative">
          <select
            value={localFilters.plan || "all"}
            onChange={(e) => updateField("plan", e.target.value)}
            className="h-8 pl-2.5 pr-6 bg-white border-[1.5px] border-[#B9CBB9] rounded-[3px] text-xs font-semibold text-[#2B302B] hover:bg-[#D3E3D3]/30 focus:outline-none focus:border-[#2B302B] appearance-none cursor-pointer"
          >
            {planOptions.map((p) => (
              <option key={p} value={p.toLowerCase().replace(/\s+/g, "-")}>
                {p === "All Plans" ? "Plan" : p}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-2 top-2.5 text-[9px] text-[#8A968A]">
            ▼
          </span>
        </div>

        {/* Status Dropdown */}
        <div className="relative">
          <select
            value={localFilters.status || "all"}
            onChange={(e) => updateField("status", e.target.value)}
            className="h-8 pl-2.5 pr-6 bg-white border-[1.5px] border-[#B9CBB9] rounded-[3px] text-xs font-semibold text-[#2B302B] hover:bg-[#D3E3D3]/30 focus:outline-none focus:border-[#2B302B] appearance-none cursor-pointer"
          >
            {statusOptions.map((s) => (
              <option key={s} value={s.toLowerCase()}>
                {s === "All Statuses" ? "Status" : s}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-2 top-2.5 text-[9px] text-[#8A968A]">
            ▼
          </span>
        </div>

        {/* Payment Method Dropdown */}
        <div className="relative">
          <select
            value={localFilters.paymentMethod || "all"}
            onChange={(e) => updateField("paymentMethod", e.target.value)}
            className="h-8 pl-2.5 pr-6 bg-white border-[1.5px] border-[#B9CBB9] rounded-[3px] text-xs font-semibold text-[#2B302B] hover:bg-[#D3E3D3]/30 focus:outline-none focus:border-[#2B302B] appearance-none cursor-pointer"
          >
            {paymentMethodOptions.map((m) => (
              <option key={m} value={m.toLowerCase().replace(/\s+/g, "-")}>
                {m === "All Methods" ? "Payment method" : m}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-2 top-2.5 text-[9px] text-[#8A968A]">
            ▼
          </span>
        </div>
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-3">
        {/* Reset Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="text-[#8A968A] hover:text-[#2B302B] text-xs gap-1 h-8 px-2"
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </Button>

        {/* Summary / Detailed Toggle */}
        <div className="flex items-center gap-1.5 text-xs select-none">
          <label className="text-[11px] font-medium text-[#8A968A] cursor-pointer">
            Summary
          </label>
          <button
            type="button"
            role="switch"
            aria-checked={localFilters.viewMode === "detailed"}
            onClick={() =>
              updateField(
                "viewMode",
                localFilters.viewMode === "detailed" ? "summary" : "detailed"
              )
            }
            className={cn(
              "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-[1.5px] border-[#B9CBB9] transition-colors focus:outline-none",
              localFilters.viewMode === "detailed" ? "bg-[#2B302B]" : "bg-[#D3E3D3]"
            )}
          >
            <span
              className={cn(
                "pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out mt-[1px]",
                localFilters.viewMode === "detailed" ? "translate-x-4" : "translate-x-0.5"
              )}
            />
          </button>
          <label className="text-[11px] font-medium text-[#2B302B] cursor-pointer">
            Detailed
          </label>
        </div>

        {/* Export CSV Button */}
        <Button
          variant="default"
          size="sm"
          onClick={onExportCsv}
          className="h-8 px-3 text-xs bg-[#2B302B] text-white hover:bg-[#1b1f1b] gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </Button>
      </div>
    </div>
  );
}

