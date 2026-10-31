"use client";

import * as React from "react";
import { Invoice, Payment, InvoiceLine } from "@/types";
import { formatMoney, formatDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/ui-shared/StatusBadge";
import { PaymentHistoryTimeline } from "./PaymentHistoryTimeline";
import { AlertTriangle, Download } from "lucide-react";

interface InvoiceSheetProps {
  invoice: Invoice;
  payments: Payment[];
  className?: string;
}

const TAX_RATE = 0.18; // 18% GST

function buildLines(invoice: Invoice): InvoiceLine[] {
  if (invoice.lines && invoice.lines.length > 0) return invoice.lines;
  // Synthesise two lines when none exist
  const base = Math.round(invoice.totalAmount / 1.18);
  const tax = invoice.totalAmount - base;
  return [
    {
      id: `${invoice.id}-line-1`,
      invoiceId: invoice.id,
      description: "Subscription Service — Base Plan",
      quantity: 1,
      unitPrice: base,
      amount: base,
    },
    {
      id: `${invoice.id}-line-2`,
      invoiceId: invoice.id,
      description: "GST (18%)",
      quantity: 1,
      unitPrice: tax,
      amount: tax,
    },
  ];
}

/**
 * InvoiceSheet
 * Printable invoice layout: company header, customer block, overdue banner,
 * line items table, tax breakdown, grand total, payment history.
 * Renders correctly in print media (Tailwind print: classes).
 */
export function InvoiceSheet({ invoice, payments, className }: InvoiceSheetProps) {
  const lines = buildLines(invoice);
  const subtotal = lines.reduce((s, l) => s + l.amount, 0);
  const taxAmount = Math.round(subtotal * TAX_RATE * 0.85); // approximate GST already embedded
  const discountAmount = 0; // TODO: real discount from Member 3
  const grandTotal = invoice.totalAmount;
  const paidAmount = grandTotal - invoice.balance;
  const isOverdue = invoice.status === "overdue";

  const handleDownload = () => {
    window.print();
  };

  return (
    <div
      className={cn(
        "bg-white border-[1.5px] border-[#B9CBB9] rounded-[3px] overflow-hidden print:border-0 print:rounded-none",
        className
      )}
    >
      {/* ── Overdue Banner ─────────────────────────────────────────────── */}
      {isOverdue && (
        <div className="bg-[#F57B4A] text-white px-5 py-2.5 flex items-center gap-2.5 print:block">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span className="text-xs font-bold uppercase tracking-widest">
            OVERDUE — {invoice.daysOverdue} day{invoice.daysOverdue !== 1 ? "s" : ""} past due.
            Payment of {formatMoney(invoice.balance)} is outstanding.
          </span>
        </div>
      )}

      <div className="p-6 sm:p-8 space-y-8 print:p-6">
        {/* ── Company Header ──────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row justify-between gap-6 border-b border-[#B9CBB9] pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {/* Inline hexagon logo mark */}
              <svg
                viewBox="0 0 24 24"
                className="w-6 h-6 text-[#2B302B]"
                fill="none"
                aria-hidden
              >
                <polygon
                  points="12,2 21,7.2 21,16.8 12,22 3,16.8 3,7.2"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-lg font-black uppercase tracking-tight text-[#2B302B]">
                BRIGHTLOOP
              </span>
            </div>
            <p className="text-[11px] text-[#8A968A] font-mono leading-relaxed">
              Subscription Control System<br />
              12 Telemetry Park, Sector 5<br />
              Bengaluru, Karnataka 560001<br />
              GSTIN: 29AABCB1234L1ZX
            </p>
          </div>

          <div className="text-right sm:text-right">
            <div className="text-2xl font-black uppercase text-[#2B302B] tracking-tight">
              INVOICE
            </div>
            <div className="mt-2 space-y-0.5 text-[11px] font-mono">
              <div>
                <span className="text-[#8A968A]">NO: </span>
                <span className="font-bold text-[#2B302B]">{invoice.invoiceNo}</span>
              </div>
              <div>
                <span className="text-[#8A968A]">ISSUED: </span>
                <span className="text-[#2B302B]">{formatDate(invoice.issueDate)}</span>
              </div>
              <div>
                <span className="text-[#8A968A]">DUE: </span>
                <span className={cn("font-bold", isOverdue ? "text-[#F57B4A]" : "text-[#2B302B]")}>
                  {formatDate(invoice.dueDate)}
                </span>
              </div>
              <div className="mt-1">
                <StatusBadge status={invoice.status} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Customer Block ──────────────────────────────────────────── */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#8A968A] font-mono mb-1.5">
            BILL TO
          </p>
          <p className="text-sm font-bold text-[#2B302B]">
            {invoice.customer?.company ?? "—"}
          </p>
          <p className="text-[11px] text-[#8A968A] font-mono leading-relaxed mt-0.5">
            {invoice.customer?.address ?? "Address on file"}<br />
            {invoice.customer?.email}<br />
            {invoice.customer?.taxId && <>GSTIN: {invoice.customer.taxId}</>}
          </p>
        </div>

        {/* ── Line Items Table ────────────────────────────────────────── */}
        <div>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-[#D3E3D3] border-b-[1.5px] border-[#B9CBB9]">
                {["DESCRIPTION", "QTY", "UNIT PRICE", "AMOUNT"].map((h) => (
                  <th
                    key={h}
                    className={cn(
                      "px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#2B302B] font-mono",
                      h !== "DESCRIPTION" ? "text-right" : "text-left"
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#B9CBB9]/60">
              {lines.map((line, i) => (
                <tr key={line.id ?? i} className="bg-white">
                  <td className="px-3 py-2.5 text-[#2B302B] font-medium">
                    {line.description}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-[#8A968A]">
                    {line.quantity}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-[#8A968A]">
                    {formatMoney(line.unitPrice)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-semibold text-[#2B302B]">
                    {formatMoney(line.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Totals Box ──────────────────────────────────────────────── */}
        <div className="flex justify-end">
          <div className="w-full sm:w-72 space-y-1.5 bg-[#E4EEE4]/50 border border-[#B9CBB9] rounded-[2px] p-4">
            {discountAmount > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-[#8A968A] font-mono uppercase tracking-wide">
                  DISCOUNT
                </span>
                <span className="text-[#F57B4A] font-semibold tabular-nums">
                  −{formatMoney(discountAmount)}
                </span>
              </div>
            )}

            <div className="flex justify-between text-xs border-t border-[#B9CBB9] pt-1.5">
              <span className="font-bold uppercase tracking-wide text-[#2B302B] font-mono">
                GRAND TOTAL
              </span>
              <span className="font-black text-[#2B302B] tabular-nums">
                {formatMoney(grandTotal)}
              </span>
            </div>

            <div className="flex justify-between text-xs">
              <span className="text-[#8A968A] font-mono uppercase tracking-wide">
                PAID
              </span>
              <span className="text-[#2B302B] font-semibold tabular-nums">
                {formatMoney(paidAmount)}
              </span>
            </div>

            <div className="flex justify-between text-xs border-t border-[#B9CBB9] pt-1.5">
              <span
                className={cn(
                  "font-bold uppercase tracking-wide font-mono",
                  invoice.balance > 0 ? "text-[#F57B4A]" : "text-[#2B302B]"
                )}
              >
                BALANCE DUE
              </span>
              <span
                className={cn(
                  "font-black tabular-nums",
                  invoice.balance > 0 ? "text-[#F57B4A]" : "text-[#2B302B]"
                )}
              >
                {formatMoney(invoice.balance)}
              </span>
            </div>
          </div>
        </div>

        {/* ── Payment History ─────────────────────────────────────────── */}
        {payments.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#8A968A] font-mono mb-3">
              PAYMENT HISTORY
            </p>
            <PaymentHistoryTimeline payments={payments} />
          </div>
        )}

        {/* ── Download / Print Actions ────────────────────────────────── */}
        <div className="flex items-center gap-3 pt-2 border-t border-[#B9CBB9] print:hidden">
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-2 h-8 px-4 text-[10px] font-bold uppercase tracking-widest rounded-[2px] border border-[#B9CBB9] bg-white text-[#2B302B] hover:bg-[#D3E3D3]/60 transition-colors font-mono"
          >
            <Download className="w-3.5 h-3.5" />
            DOWNLOAD PDF
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 h-8 px-4 text-[10px] font-bold uppercase tracking-widest rounded-[2px] border border-[#B9CBB9] bg-white text-[#2B302B] hover:bg-[#D3E3D3]/60 transition-colors font-mono"
          >
            PRINT
          </button>
          <p className="text-[10px] text-[#8A968A] font-mono ml-1">
            {/* TODO: Member 3 – replace placeholder with real PDF service endpoint */}
          </p>
        </div>
      </div>
    </div>
  );
}

