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
            "h-8 px-2.5 bg-white border-[1.5px] border-[#B9CBB9] rounded-[3px] text-xs font-medium text-[#2B302B] hover:bg-[#D3E3D3]/40 flex items-center gap-2 select-none focus:outline-none focus:border-[#2B302B] transition-colors",
            className
          )}
        >
          <CalendarIcon className="w-3.5 h-3.5 text-[#8A968A]" />
          <span className="font-semibold text-[#2B302B] font-mono text-[11px]">
            {internalVal.preset === "Custom"
              ? `${internalVal.from} → ${internalVal.to}`
              : internalVal.preset}
          </span>
          <ChevronDown className="w-3 h-3 text-[#8A968A] ml-1" />
        </button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={4}
          className="z-50 w-72 bg-white border-[1.5px] border-[#B9CBB9] rounded-[3px] p-3 shadow-none focus:outline-none animate-in fade-in-0 zoom-in-95"
        >
          <div className="space-y-3">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8A968A] border-b border-[#B9CBB9] pb-1.5">
              TELEMETRY DATE FILTER
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
                      "px-2 py-1.5 text-[11px] font-medium rounded-[2px] border text-left flex items-center justify-between transition-colors",
                      isSelected
                        ? "bg-[#2B302B] text-white border-[#2B302B]"
                        : "bg-[#E4EEE4]/50 text-[#2B302B] border-[#B9CBB9] hover:bg-[#D3E3D3]"
                    )}
                  >
                    <span>{p}</span>
                    {isSelected && <Check className="w-3 h-3 text-[#F57B4A]" />}
                  </button>
                );
              })}
            </div>

            {/* Custom Date Inputs */}
            <div className="pt-2 border-t border-[#B9CBB9] space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#8A968A] block">
                CUSTOM INTERVAL (ISO)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-mono text-[#8A968A] uppercase block mb-0.5">
                    START
                  </label>
                  <input
                    type="date"
                    value={internalVal.from}
                    onChange={(e) => handleCustomChange("from", e.target.value)}
                    className="w-full text-xs font-mono px-2 py-1 bg-white border border-[#B9CBB9] rounded-[2px] text-[#2B302B] focus:outline-none focus:border-[#2B302B]"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-mono text-[#8A968A] uppercase block mb-0.5">
                    END
                  </label>
                  <input
                    type="date"
                    value={internalVal.to}
                    onChange={(e) => handleCustomChange("to", e.target.value)}
                    className="w-full text-xs font-mono px-2 py-1 bg-white border border-[#B9CBB9] rounded-[2px] text-[#2B302B] focus:outline-none focus:border-[#2B302B]"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="default"
                size="sm"
                onClick={() => setOpen(false)}
                className="w-full text-xs"
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

