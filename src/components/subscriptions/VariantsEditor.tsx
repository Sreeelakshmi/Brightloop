"use client";

import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { THEME } from "./theme";

export interface VariantItem {
  id?: string;
  attribute: string;
  value: string;
  extraPrice: number;
}

interface VariantsEditorProps {
  variants: VariantItem[];
  onChange: (variants: VariantItem[]) => void;
  error?: string;
}

export function VariantsEditor({ variants, onChange, error }: VariantsEditorProps) {
  const addRow = () => {
    onChange([...variants, { attribute: "", value: "", extraPrice: 0 }]);
  };

  const removeRow = (index: number) => {
    onChange(variants.filter((_, i) => i !== index));
  };

  const updateRow = (index: number, field: keyof VariantItem, val: string | number) => {
    const updated = variants.map((item, i) => {
      if (i !== index) return item;
      return {
        ...item,
        [field]: field === "extraPrice" ? Math.max(0, Number(val) || 0) : val,
      };
    });
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-[#1F2622]">Product Variants</label>
          <p className="text-xs text-[#657367]">
            Configure options such as size, color, or capacity with extra surcharges.
          </p>
        </div>
        <button
          type="button"
          onClick={addRow}
          className={`h-8 px-3 ${THEME.secondaryButton} text-xs flex items-center gap-1 uppercase tracking-wider`}
        >
          <Plus className="w-3.5 h-3.5" />
          Add Variant
        </button>
      </div>

      {error && <p className="text-xs text-[#D95522] font-medium">{error}</p>}

      {variants.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#D5DDD2] p-4 text-center text-xs text-[#657367] bg-[#F3F7F2]">
          No variants defined yet. Click &quot;Add Variant&quot; to configure options.
        </div>
      ) : (
        <div className="space-y-2">
          {variants.map((v, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Attribute (e.g. Storage)"
                value={v.attribute}
                onChange={(e) => updateRow(idx, "attribute", e.target.value)}
                className={`flex-1 ${THEME.input}`}
              />
              <input
                type="text"
                placeholder="Value (e.g. 512GB)"
                value={v.value}
                onChange={(e) => updateRow(idx, "value", e.target.value)}
                className={`flex-1 ${THEME.input}`}
              />
              <div className="relative w-28">
                <span className="absolute left-2.5 top-2 text-xs text-[#657367] font-mono">+$</span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={v.extraPrice}
                  onChange={(e) => updateRow(idx, "extraPrice", e.target.value)}
                  className={`w-full pl-7 ${THEME.input}`}
                />
              </div>
              <button
                type="button"
                onClick={() => removeRow(idx)}
                className="p-2 text-[#8C9B8E] hover:text-[#F27B4B] transition-colors"
                title="Remove variant"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
