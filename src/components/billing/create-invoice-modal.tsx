"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { calculateInvoiceTotals, formatINR, rupeesToPaise } from "@/lib/billing/math";
import { createManualInvoiceAction } from "@/app/actions/billing";
import {
  Plus,
  Trash2,
  X,
  FilePlus2,
  CheckCircle,
  AlertCircle,
  Loader2,
  Calculator,
} from "lucide-react";

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormItem {
  description: string;
  quantity: number;
  unitPriceRupees: number;
  taxRatePercent: number;
  discountCode: string;
}

export function CreateInvoiceModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateInvoiceModalProps) {
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split("T")[0];
  });
  const [notes, setNotes] = useState("");

  const [items, setItems] = useState<FormItem[]>([
    {
      description: "Cloud Infrastructure Support & Maintenance",
      quantity: 1,
      unitPriceRupees: 5000,
      taxRatePercent: 18,
      discountCode: "",
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Live calculation preview
  const calcInputs = items.map((it) => ({
    quantity: it.quantity,
    unitPricePaise: rupeesToPaise(it.unitPriceRupees),
    taxRatePercent: it.taxRatePercent,
  }));
  const previewTotals = calculateInvoiceTotals(calcInputs, 0);

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        description: "",
        quantity: 1,
        unitPriceRupees: 1000,
        taxRatePercent: 18,
        discountCode: "",
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof FormItem, value: any) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!customerName.trim() || !customerEmail.trim()) {
      setErrorMsg("Customer name and email are required.");
      return;
    }

    if (items.some((it) => !it.description.trim() || it.unitPriceRupees <= 0 || it.quantity <= 0)) {
      setErrorMsg("All items must have a valid description, quantity (> 0), and price (> 0).");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createManualInvoiceAction({
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        dueDate: new Date(dueDate).toISOString(),
        notes: notes.trim() || undefined,
        items: items.map((it) => ({
          description: it.description.trim(),
          quantity: it.quantity,
          unitPriceRupees: it.unitPriceRupees,
          taxRatePercent: it.taxRatePercent,
          discountCode: it.discountCode.trim() || undefined,
        })),
      });

      if (!res.success || !res.data) {
        setErrorMsg(res.error || "Failed to create invoice.");
      } else {
        setSuccessMsg(`Invoice ${res.data.invoiceNumber} created successfully!`);
        setTimeout(() => {
          onClose();
          if (onSuccess) onSuccess();
        }, 1200);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-background border border-border w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4 bg-muted/30">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <FilePlus2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Create New Tax Invoice</h3>
              <p className="text-xs text-muted-foreground">
                Generate an ad-hoc or quotation invoice with itemized Indian GST tax computation.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-destructive/15 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Customer & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1">Customer / Company Name</label>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Acme Innovations"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Customer Email</label>
              <Input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="billing@acme.com"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Payment Due Date</label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Line Items Section */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Itemized Line Items ({items.length})
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
                className="h-7 text-xs flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Item
              </Button>
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {items.map((it, idx) => (
                <div
                  key={idx}
                  className="p-3 border rounded-lg bg-muted/20 grid grid-cols-12 gap-2 items-center text-xs"
                >
                  <div className="col-span-12 sm:col-span-5">
                    <Input
                      placeholder="Item description / service"
                      value={it.description}
                      onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                      className="h-8 text-xs"
                      required
                    />
                  </div>
                  <div className="col-span-3 sm:col-span-2">
                    <Input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={it.quantity}
                      onChange={(e) =>
                        handleItemChange(idx, "quantity", parseInt(e.target.value, 10) || 1)
                      }
                      className="h-8 text-xs text-center"
                      required
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="Price (₹)"
                      value={it.unitPriceRupees}
                      onChange={(e) =>
                        handleItemChange(idx, "unitPriceRupees", parseFloat(e.target.value) || 0)
                      }
                      className="h-8 text-xs"
                      required
                    />
                  </div>
                  <div className="col-span-3 sm:col-span-2">
                    <select
                      value={it.taxRatePercent}
                      onChange={(e) =>
                        handleItemChange(idx, "taxRatePercent", parseFloat(e.target.value) || 0)
                      }
                      className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs shadow-sm"
                    >
                      <option value="18">18% GST</option>
                      <option value="12">12% GST</option>
                      <option value="5">5% GST</option>
                      <option value="0">0% (Zero)</option>
                    </select>
                  </div>
                  <div className="col-span-2 sm:col-span-1 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveItem(idx)}
                      disabled={items.length <= 1}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-medium block mb-1">Invoice Notes & Terms (Optional)</label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Net 15 days payment terms. Wire transfer details on bottom."
              className="text-xs"
            />
          </div>

          {/* Live Financial Calculation Box */}
          <div className="p-4 bg-muted/40 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calculator className="w-4 h-4 text-primary" />
              <span>Evaluated in integer paise: Line subtotal → GST → Line total</span>
            </div>
            <div className="flex items-center gap-6 font-mono">
              <div>
                <span className="text-muted-foreground block text-[10px]">Subtotal:</span>
                <span className="font-semibold text-foreground">{formatINR(previewTotals.subtotalPaise)}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">GST Total:</span>
                <span className="font-semibold text-foreground">{formatINR(previewTotals.taxTotalPaise)}</span>
              </div>
              <div>
                <span className="text-primary block text-[10px] font-bold">Total Amount:</span>
                <span className="font-bold text-sm text-primary">{formatINR(previewTotals.totalPaise)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Invoice...
                </>
              ) : (
                `Generate Invoice (${formatINR(previewTotals.totalPaise)})`
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
