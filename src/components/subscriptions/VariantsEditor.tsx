"use client";

import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

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
          <label className="text-sm font-medium text-foreground">Product Variants</label>
          <p className="text-xs text-muted-foreground">
            Configure options such as size, color, or capacity with extra surcharges.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addRow} className="h-8 text-xs gap-1">
          <Plus className="w-3.5 h-3.5" />
          Add Variant
        </Button>
      </div>

      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

      {variants.length === 0 ? (
        <div className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
          No variants defined yet. Click &quot;Add Variant&quot; to add options.
        </div>
      ) : (
        <div className="space-y-2">
          {variants.map((v, idx) => (
            <div key={v.id ?? idx} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Attribute (e.g. Color)"
                value={v.attribute}
                onChange={(e) => updateRow(idx, "attribute", e.target.value)}
                className="flex-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                required
              />
              <input
                type="text"
                placeholder="Value (e.g. Space Gray)"
                value={v.value}
                onChange={(e) => updateRow(idx, "value", e.target.value)}
                className="flex-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                required
              />
              <div className="w-32 relative">
                <span className="absolute left-2.5 top-2 text-xs text-muted-foreground">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={v.extraPrice}
                  onChange={(e) => updateRow(idx, "extraPrice", e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background pl-6 pr-2 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeRow(idx)}
                className="h-9 w-9 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
