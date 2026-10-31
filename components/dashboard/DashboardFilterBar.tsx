"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { FilterBar, FilterState } from "@/components/ui-shared";

const DEFAULT_CUSTOMER_OPTIONS = [
  "All Customers",
  "Tata Consultancy Services",
  "Infosys Ltd",
  "Wipro Enterprises",
  "Reliance Industries",
  "HCL Technologies",
  "Mahindra & Mahindra",
  "Larsen & Toubro",
  "Bharti Airtel",
  "Sun Pharma",
  "ITC Infotech",
];

const DEFAULT_PLAN_OPTIONS = [
  "All Plans",
  "Daily Essential",
  "Weekly Growth",
  "Standard Monthly",
  "Monthly Business Pro",
  "Annual Enterprise",
  "Enterprise Plus Annual",
];

/** Active filter chip that can be removed */
function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#D3E3D3] border border-[#B9CBB9] rounded-[3px] text-[11px] font-semibold text-[#2B302B] font-mono">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label} filter`}
        className="text-[#8A968A] hover:text-[#F57B4A] transition-colors leading-none"
      >
        ×
      </button>
    </span>
  );
}

function getActiveChips(filters: FilterState) {
  const chips: { label: string; key: keyof FilterState }[] = [];
  if (filters.customer && filters.customer !== "all" && filters.customer !== "customer") {
    chips.push({ label: `Customer: ${filters.customer}`, key: "customer" });
  }
  if (filters.plan && filters.plan !== "all" && filters.plan !== "plan") {
    chips.push({ label: `Plan: ${filters.plan}`, key: "plan" });
  }
  if (filters.status && filters.status !== "all" && filters.status !== "all-statuses") {
    chips.push({ label: `Status: ${filters.status}`, key: "status" });
  }
  if (
    filters.paymentMethod &&
    filters.paymentMethod !== "all" &&
    filters.paymentMethod !== "all-methods"
  ) {
    chips.push({ label: `Method: ${filters.paymentMethod}`, key: "paymentMethod" });
  }
  if (filters.datePreset && filters.datePreset !== "This month") {
    chips.push({ label: `Date: ${filters.datePreset}`, key: "datePreset" });
  }
  return chips;
}

/** Reads filter state from URL search params */
export function readFiltersFromUrl(sp: URLSearchParams): FilterState {
  return {
    datePreset: (sp.get("dp") as FilterState["datePreset"]) ?? "This month",
    customer: sp.get("customer") ?? "all",
    plan: sp.get("plan") ?? "all",
    status: sp.get("status") ?? "all",
    paymentMethod: sp.get("method") ?? "all",
    viewMode: (sp.get("view") as "summary" | "detailed") ?? "summary",
  };
}

export function DashboardFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = readFiltersFromUrl(searchParams);

  const store = React.useMemo(() => {
    return {
      customers: DEFAULT_CUSTOMER_OPTIONS,
      plans: DEFAULT_PLAN_OPTIONS,
    };
  }, []);

  const pushFilters = (f: FilterState) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("dp", f.datePreset ?? "This month");
    params.set("customer", f.customer ?? "all");
    params.set("plan", f.plan ?? "all");
    params.set("status", f.status ?? "all");
    params.set("method", f.paymentMethod ?? "all");
    params.set("view", f.viewMode ?? "summary");
    // Reset pagination on filter change
    params.set("inv_page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleReset = () => {
    router.push(pathname);
  };

  const removeChip = (key: keyof FilterState) => {
    const defaults: Partial<FilterState> = {
      customer: "all",
      plan: "all",
      status: "all",
      paymentMethod: "all",
      datePreset: "This month",
    };
    pushFilters({ ...filters, [key]: defaults[key] ?? "all" });
  };

  const handleExportCsv = () => {
    // Build query string for CSV endpoint
    const params = new URLSearchParams(searchParams.toString());
    params.set("export", "csv");
    window.location.href = `/api/export/overdue-invoices?${params.toString()}`;
  };

  const chips = getActiveChips(filters);

  return (
    <div className="space-y-2">
      <FilterBar
        filters={filters}
        onFilterChange={pushFilters}
        onReset={handleReset}
        onExportCsv={handleExportCsv}
        customerOptions={store.customers}
        planOptions={store.plans}
      />
      {/* Active filter chips */}
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-0.5">
          {chips.map((chip) => (
            <FilterChip
              key={chip.key}
              label={chip.label}
              onRemove={() => removeChip(chip.key)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
