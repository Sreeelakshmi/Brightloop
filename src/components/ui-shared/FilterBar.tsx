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
        "bg-white border border-[#D5DDD2] rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-sm",
        className
      )}
    >
      {/* Left side filters */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {/* Date Preset */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-medium text-[#8C9B8E] select-none">
            Date preset
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
            className="h-8 pl-3 pr-7 bg-white border border-[#D5DDD2] rounded-lg text-xs font-semibold text-[#1F2622] hover:bg-[#EBF1EA]/60 focus:outline-none focus:border-[#1F2622] appearance-none cursor-pointer transition-colors"
          >
            {customerOptions.map((c) => (
              <option key={c} value={c.toLowerCase().replace(/\s+/g, "-")}>
                {c === "All Customers" ? "Customer" : c}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-2.5 top-2.5 text-[9px] text-[#8C9B8E]">
            ▼
          </span>
        </div>

        {/* Plan Dropdown */}
        <div className="relative">
          <select
            value={localFilters.plan || "all"}
            onChange={(e) => updateField("plan", e.target.value)}
            className="h-8 pl-3 pr-7 bg-white border border-[#D5DDD2] rounded-lg text-xs font-semibold text-[#1F2622] hover:bg-[#EBF1EA]/60 focus:outline-none focus:border-[#1F2622] appearance-none cursor-pointer transition-colors"
          >
            {planOptions.map((p) => (
              <option key={p} value={p.toLowerCase().replace(/\s+/g, "-")}>
                {p === "All Plans" ? "Plan" : p}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-2.5 top-2.5 text-[9px] text-[#8C9B8E]">
            ▼
          </span>
        </div>

        {/* Status Dropdown */}
        <div className="relative">
          <select
            value={localFilters.status || "all"}
            onChange={(e) => updateField("status", e.target.value)}
            className="h-8 pl-3 pr-7 bg-white border border-[#D5DDD2] rounded-lg text-xs font-semibold text-[#1F2622] hover:bg-[#EBF1EA]/60 focus:outline-none focus:border-[#1F2622] appearance-none cursor-pointer transition-colors"
          >
            {statusOptions.map((s) => (
              <option key={s} value={s.toLowerCase()}>
                {s === "All Statuses" ? "Status" : s}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-2.5 top-2.5 text-[9px] text-[#8C9B8E]">
            ▼
          </span>
        </div>

        {/* Payment Method Dropdown */}
        <div className="relative">
          <select
            value={localFilters.paymentMethod || "all"}
            onChange={(e) => updateField("paymentMethod", e.target.value)}
            className="h-8 pl-3 pr-7 bg-white border border-[#D5DDD2] rounded-lg text-xs font-semibold text-[#1F2622] hover:bg-[#EBF1EA]/60 focus:outline-none focus:border-[#1F2622] appearance-none cursor-pointer transition-colors"
          >
            {paymentMethodOptions.map((m) => (
              <option key={m} value={m.toLowerCase().replace(/\s+/g, "-")}>
                {m === "All Methods" ? "Payment method" : m}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-2.5 top-2.5 text-[9px] text-[#8C9B8E]">
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
          className="text-[#8C9B8E] hover:text-[#1F2622] text-xs gap-1 h-8 px-2 hover:bg-transparent"
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </Button>

        {/* Summary / Detailed Toggle */}
        <div className="flex items-center gap-2 text-xs select-none">
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
              "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-[#D5DDD2] transition-colors focus:outline-none",
              localFilters.viewMode === "detailed" ? "bg-[#1F2622]" : "bg-[#DDE5DB]"
            )}
          >
            <span
              className={cn(
                "pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out mt-[2px]",
                localFilters.viewMode === "detailed" ? "translate-x-4" : "translate-x-0.5"
              )}
            />
          </button>
          <span className="text-xs font-medium text-[#1F2622] cursor-pointer">
            Summary / Detailed
          </span>
        </div>

        {/* Export CSV Button */}
        <Button
          variant="default"
          size="sm"
          onClick={onExportCsv}
          className="h-8 px-3.5 text-xs font-semibold bg-[#1F2622] text-white hover:bg-[#2A342E] rounded-lg gap-1.5 transition-colors shadow-none"
        >
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </Button>
      </div>
    </div>
  );
}
