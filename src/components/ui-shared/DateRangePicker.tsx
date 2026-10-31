import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, ChevronDown, Check } from "lucide-react";

export type DatePreset = "This month" | "Last 30 days" | "This year" | "Custom";

export interface DateRangeValue {
  from: string; // YYYY-MM-DD
  to: string;   // YYYY-MM-DD
  preset: DatePreset;
}

export interface DateRangePickerProps {
  value?: DateRangeValue;
  onChange?: (val: DateRangeValue) => void;
  className?: string;
}

/**
 * Calculates date bounds for standard presets
 */
function getPresetBounds(preset: DatePreset): { from: string; to: string } {
  const today = new Date();
  const format = (d: Date) => d.toISOString().split("T")[0];

  if (preset === "This month") {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return { from: format(start), to: format(end) };
  }

  if (preset === "Last 30 days") {
    const start = new Date();
    start.setDate(today.getDate() - 30);
    return { from: format(start), to: format(today) };
  }

  if (preset === "This year") {
    const start = new Date(today.getFullYear(), 0, 1);
    const end = new Date(today.getFullYear(), 11, 31);
    return { from: format(start), to: format(end) };
  }

  // Custom fallback
  return { from: format(today), to: format(today) };
}

/**
 * DateRangePicker Component
 * Telemetry-styled date range selector with preset buttons and custom range inputs.
 */
export function DateRangePicker({
  value = {
    preset: "This month",
    from: "2026-10-01",
    to: "2026-10-31",
  },
  onChange,
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [internalVal, setInternalVal] = React.useState<DateRangeValue>(value);

  const presets: DatePreset[] = ["This month", "Last 30 days", "This year", "Custom"];

  const handlePresetSelect = (preset: DatePreset) => {
    if (preset === "Custom") {
      const updated = { ...internalVal, preset };
      setInternalVal(updated);
      onChange?.(updated);
      return;
    }

    const bounds = getPresetBounds(preset);
    const updated: DateRangeValue = {
      preset,
      from: bounds.from,
      to: bounds.to,
    };
    setInternalVal(updated);
    onChange?.(updated);
    setOpen(false);
  };

  const handleCustomChange = (type: "from" | "to", dateStr: string) => {
    const updated: DateRangeValue = {
      ...internalVal,
      preset: "Custom",
      [type]: dateStr,
    };
    setInternalVal(updated);
    onChange?.(updated);
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          className={cn(
            "h-8 px-3 bg-[#EBF1EA] border border-[#D5DDD2] rounded-lg text-xs font-semibold text-[#1F2622] hover:bg-[#DDE5DB] flex items-center gap-1.5 select-none focus:outline-none focus:border-[#1F2622] transition-colors",
            className
          )}
        >
          <span>
            {internalVal.preset === "Custom"
              ? `${internalVal.from} → ${internalVal.to}`
              : internalVal.preset}
          </span>
          <ChevronDown className="w-3 h-3 text-[#8C9B8E] ml-0.5" />
        </button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={4}
          className="z-50 w-72 bg-white border border-[#D5DDD2] rounded-xl p-3 shadow-lg focus:outline-none animate-in fade-in-0 zoom-in-95"
        >
          <div className="space-y-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#8C9B8E] border-b border-[#D5DDD2] pb-1.5">
              DATE FILTER
            </div>

            {/* Presets List */}
            <div className="grid grid-cols-2 gap-1.5">
              {presets.map((p) => {
                const isSelected = internalVal.preset === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handlePresetSelect(p)}
                    className={cn(
                      "px-2.5 py-1.5 text-xs font-medium rounded-lg border text-left flex items-center justify-between transition-colors",
                      isSelected
                        ? "bg-[#1F2622] text-white border-[#1F2622]"
                        : "bg-white text-[#1F2622] border-[#D5DDD2] hover:bg-[#EBF1EA]"
                    )}
                  >
                    <span>{p}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#F27B4B]" />}
                  </button>
                );
              })}
            </div>

            {/* Custom Date Inputs */}
            <div className="pt-2 border-t border-[#D5DDD2] space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#8C9B8E] block">
                CUSTOM INTERVAL
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-[#8C9B8E] uppercase font-semibold block mb-0.5">
                    START
                  </label>
                  <input
                    type="date"
                    value={internalVal.from}
                    onChange={(e) => handleCustomChange("from", e.target.value)}
                    className="w-full text-xs px-2 py-1 bg-white border border-[#D5DDD2] rounded-lg text-[#1F2622] focus:outline-none focus:border-[#1F2622]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#8C9B8E] uppercase font-semibold block mb-0.5">
                    END
                  </label>
                  <input
                    type="date"
                    value={internalVal.to}
                    onChange={(e) => handleCustomChange("to", e.target.value)}
                    className="w-full text-xs px-2 py-1 bg-white border border-[#D5DDD2] rounded-lg text-[#1F2622] focus:outline-none focus:border-[#1F2622]"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="default"
                size="sm"
                onClick={() => setOpen(false)}
                className="w-full text-xs bg-[#1F2622] text-white hover:bg-[#2A342E] rounded-lg"
              >
                Apply Range
              </Button>
            </div>
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
