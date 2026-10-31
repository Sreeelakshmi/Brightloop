"use client";

import * as React from "react";
import { Invoice, Payment, PaymentMethod } from "@/types";
import { PageHeader, StatusBadge } from "@/components/ui-shared";
import { formatMoney } from "@/lib/formatters";
import Link from "next/link";
import {
  ArrowLeft,
  Printer,
  Mail,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Download,
} from "lucide-react";
import {
  handleConfirmInvoice,
  handleSendInvoiceEmail,
  handleRecordPayment,
} from "@/app/actions/billing-actions";

interface InvoiceDetailClientProps {
  initialInvoice: Invoice;
  payments: Payment[];
  isAdmin: boolean;
}

export function InvoiceDetailClient({
  initialInvoice,
  payments: initialPayments,
  isAdmin,
}: InvoiceDetailClientProps) {
  const [invoice, setInvoice] = React.useState<Invoice>(initialInvoice);
  const [payments, setPayments] = React.useState<Payment[]>(initialPayments);

  // Record Payment Modal State
  const [isPayModalOpen, setIsPayModalOpen] = React.useState(false);
  const [payAmount, setPayAmount] = React.useState<string>(String(initialInvoice.balance));
  const [payMethod, setPayMethod] = React.useState<PaymentMethod>("upi");
  const [payNote, setPayNote] = React.useState<string>("");
  const [loadingPay, setLoadingPay] = React.useState(false);

  const [notification, setNotification] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  const isOverdue = invoice.status === "overdue" || (invoice.balance > 0 && invoice.daysOverdue > 0);

  const handlePrint = () => {
    window.print();
  };

  const handleConfirm = async () => {
    setNotification(null);
    const res = await handleConfirmInvoice(invoice.id);
    if (res.success && res.invoice) {
      setInvoice(res.invoice);
      setNotification({ type: "success", text: `Invoice ${invoice.invoiceNo} confirmed successfully!` });
    } else {
      setNotification({ type: "error", text: res.error || "Failed to confirm invoice" });
    }
  };

  const handleSendEmail = async () => {
    setNotification(null);
    const res = await handleSendInvoiceEmail(invoice.id);
    if (res.success) {
      setNotification({
        type: "success",
        text: `Invoice ${invoice.invoiceNo} dispatched to ${res.emailTo} (viewable in Dev Mailbox)!`,
      });
    } else {
      setNotification({ type: "error", text: res.error || "Failed to send invoice email" });
    }
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);
    setLoadingPay(true);

    const res = await handleRecordPayment({
      invoiceId: invoice.id,
      amount: Number(payAmount),
      method: payMethod,
      note: payNote,
    });

    setLoadingPay(false);
    if (res.success && res.payment) {
      setPayments([res.payment, ...payments]);
      const newBalance = Math.max(0, invoice.balance - res.payment.amount);
      setInvoice({
        ...invoice,
        balance: newBalance,
        paidAmount: (invoice.paidAmount || 0) + res.payment.amount,
        status: newBalance === 0 ? "paid" : invoice.status,
      });
      setIsPayModalOpen(false);
      setNotification({
        type: "success",
        text: `Payment of ${formatMoney(res.payment.amount)} recorded successfully!`,
      });
    } else {
      setNotification({ type: "error", text: res.error || "Failed to record payment" });
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-mono">
      {/* Top Controls Bar (hidden during print) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#CBD5CB] pb-4 print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/invoices"
            className="p-2 border border-[#CBD5CB] hover:bg-[#E4EEE4] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-[#2B302B]" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[#2B302B]">{invoice.invoiceNo}</h1>
              <StatusBadge status={invoice.status} />
            </div>
            <p className="text-xs text-[#8A968A] mt-0.5">
              Issued: {invoice.issueDate} • Due: {invoice.dueDate}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {invoice.status === "draft" && (
            <button
              onClick={handleConfirm}
              className="bg-[#2B302B] hover:bg-black text-[#E4EEE4] px-4 py-2 uppercase font-semibold transition-colors"
            >
              Confirm Invoice &rarr;
            </button>
          )}

          {invoice.balance > 0 && invoice.status !== "draft" && invoice.status !== "cancelled" && (
            <button
              onClick={() => {
                setPayAmount(String(invoice.balance));
                setIsPayModalOpen(true);
              }}
              className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 uppercase font-semibold flex items-center gap-1.5 transition-colors"
            >
              <CreditCard className="w-4 h-4" />
              Record Payment
            </button>
          )}

          <button
            onClick={handleSendEmail}
            className="px-3 py-2 border border-[#CBD5CB] text-[#2B302B] hover:bg-[#E4EEE4] uppercase flex items-center gap-1.5"
          >
            <Mail className="w-4 h-4" />
            Send Email
          </button>

          <button
            onClick={handlePrint}
            className="px-3 py-2 border border-[#CBD5CB] text-[#2B302B] hover:bg-[#E4EEE4] uppercase flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            Print / PDF
          </button>
        </div>
      </div>

      {notification && (
        <div
          className={`p-3 text-xs flex items-center gap-2 border ${
            notification.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
          )}
          <span>{notification.text}</span>
        </div>
      )}

      {/* OVERDUE ALERT BANNER */}
      {isOverdue && (
        <div className="bg-[#FFF4EE] border-2 border-[#F57B4A] p-4 text-[#2B302B] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-[#F57B4A] flex-shrink-0" />
            <div>
              <div className="font-bold text-sm text-[#F57B4A] uppercase">
                Payment Overdue ({invoice.daysOverdue} Days Past Due)
              </div>
              <div className="text-xs text-[#8A968A] mt-0.5">
                This invoice was due on {invoice.dueDate}. An outstanding balance of{" "}
                <strong>{formatMoney(invoice.balance)}</strong> remains unpaid.
              </div>
            </div>
          </div>
          <button
            onClick={handleSendEmail}
            className="bg-[#F57B4A] hover:bg-[#E06635] text-white px-3 py-1.5 text-xs uppercase font-semibold"
          >
            Send Payment Notice
          </button>
        </div>
      )}

      {/* PRINTABLE INVOICE SHEET */}
      <div className="bg-white border border-[#CBD5CB] p-8 shadow-sm print:border-none print:shadow-none print:p-0 space-y-8">
        {/* Company & Invoice Header */}
        <div className="flex justify-between items-start border-b border-[#CBD5CB] pb-6">
          <div>
            <div className="text-xl font-bold tracking-wider text-[#2B302B]">BRIGHTLOOP</div>
            <div className="text-xs text-[#8A968A] uppercase mt-0.5">
              Telemetry Systems & Automated Billing
            </div>
            <div className="text-xs text-[#8A968A] mt-3 space-y-0.5">
              <div>Tower 3, Cyber City, DLF Phase II</div>
              <div>Gurugram, Haryana 122002, India</div>
              <div>GSTIN: 07AAACB2026M1Z8</div>
              <div>billing@brightloop.io</div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-2xl font-bold text-[#2B302B]">{invoice.invoiceNo}</div>
            <div className="text-xs uppercase text-[#8A968A] mt-1 font-semibold">
              Status: <span className="text-[#2B302B]">{invoice.status.toUpperCase()}</span>
            </div>
            <div className="text-xs text-[#8A968A] mt-3 space-y-0.5">
              <div>
                Issue Date: <strong className="text-[#2B302B]">{invoice.issueDate}</strong>
              </div>
              <div>
                Due Date: <strong className="text-[#2B302B]">{invoice.dueDate}</strong>
              </div>
              {invoice.subscriptionId && (
                <div>
                  Contract Ref: <strong className="text-[#2B302B]">{invoice.subscriptionId}</strong>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bill To Customer Block */}
        <div className="border border-[#CBD5CB] p-4 bg-[#F8FAF8]">
          <div className="text-[10px] uppercase font-bold text-[#8A968A] tracking-wider mb-1">
            Billed To
          </div>
          <div className="text-sm font-bold text-[#2B302B]">{invoice.customer?.name}</div>
          <div className="text-xs text-[#2B302B]">{invoice.customer?.company}</div>
          <div className="text-xs text-[#8A968A] mt-1">
            {invoice.customer?.address || "Cyber City, Gurugram, India"} • Email:{" "}
            {invoice.customer?.email}
          </div>
          {invoice.customer?.taxId && (
            <div className="text-xs text-[#8A968A] mt-0.5">
              Customer GSTIN: <strong className="text-[#2B302B]">{invoice.customer.taxId}</strong>
            </div>
          )}
        </div>

        {/* Line Items Table */}
        <div className="overflow-hidden border border-[#CBD5CB]">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#E4EEE4] border-b border-[#CBD5CB] text-[#2B302B] uppercase">
              <tr>
                <th className="p-3">Description</th>
                <th className="p-3 text-right">Quantity</th>
                <th className="p-3 text-right">Unit Price</th>
                <th className="p-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4EEE4]">
              {(invoice.lines || []).map((l, i) => (
                <tr key={l.id || i}>
                  <td className="p-3 font-medium text-[#2B302B]">{l.description}</td>
                  <td className="p-3 text-right">{l.quantity}</td>
                  <td className="p-3 text-right">{formatMoney(l.unitPrice)}</td>
                  <td className="p-3 text-right font-bold text-[#2B302B]">{formatMoney(l.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Summary Calculation (Exact Integer Minor Units) */}
        <div className="flex justify-end pt-2">
          <div className="w-80 space-y-2 text-xs">
            <div className="flex justify-between text-[#8A968A]">
              <span>Subtotal:</span>
              <span className="font-semibold text-[#2B302B]">
                {formatMoney(invoice.subtotal || invoice.totalAmount)}
              </span>
            </div>

            {/* Tax Breakdown */}
            {invoice.taxBreakdown && invoice.taxBreakdown.length > 0 ? (
              invoice.taxBreakdown.map((t, idx) => (
                <div key={idx} className="flex justify-between text-[#8A968A]">
                  <span>{t.name} ({t.rate}%):</span>
                  <span className="font-semibold text-[#2B302B]">{formatMoney(t.amount)}</span>
                </div>
              ))
            ) : (
              <div className="flex justify-between text-[#8A968A]">
                <span>Taxes (GST 18%):</span>
                <span className="font-semibold text-[#2B302B]">
                  {formatMoney(invoice.taxTotal || 0)}
                </span>
              </div>
            )}

            {invoice.discountTotal ? (
              <div className="flex justify-between text-green-700 font-semibold">
                <span>Discount Applied:</span>
                <span>-{formatMoney(invoice.discountTotal)}</span>
              </div>
            ) : null}

            <div className="flex justify-between text-base font-bold text-[#2B302B] border-t-2 border-[#2B302B] pt-2">
              <span>Grand Total:</span>
              <span>{formatMoney(invoice.totalAmount)}</span>
            </div>

            <div className="flex justify-between text-[#8A968A] pt-1">
              <span>Amount Paid:</span>
              <span className="font-semibold text-green-700">
                {formatMoney(invoice.paidAmount || (invoice.status === "paid" ? invoice.totalAmount : 0))}
              </span>
            </div>

            <div className="flex justify-between text-sm font-bold border-t border-[#CBD5CB] pt-1 text-[#2B302B]">
              <span>Balance Due:</span>
              <span className={invoice.balance > 0 ? "text-[#F57B4A]" : "text-green-700"}>
                {formatMoney(invoice.balance)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment History Timeline */}
        <div className="border-t border-[#CBD5CB] pt-6 space-y-3">
          <h3 className="font-semibold text-xs text-[#2B302B] uppercase tracking-wider">
            Settlement & Payment History
          </h3>
          {payments.length > 0 ? (
            <div className="space-y-2">
              {payments.map((p) => (
                <div
                  key={p.id}
                  className="bg-[#F8FAF8] border border-[#CBD5CB] p-3 text-xs flex justify-between items-center"
                >
                  <div>
                    <div className="font-bold text-[#2B302B]">
                      {p.paymentNo} • <span className="uppercase">{p.method.replace(/_/g, " ")}</span>
                    </div>
                    <div className="text-[10px] text-[#8A968A]">
                      {new Date(p.paymentDate).toLocaleString("en-IN")} • Ref: {p.reference}
                      {p.note ? ` • "${p.note}"` : ""}
                    </div>
                  </div>
                  <div className="text-sm font-bold text-green-700">{formatMoney(p.amount)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-[#8A968A] italic">
              No payments recorded against this invoice yet.
            </div>
          )}
        </div>
      </div>

      {/* Record Payment Modal */}
      {isPayModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#2B302B] w-full max-w-md p-6 space-y-4 font-mono shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#CBD5CB] pb-3">
              <h3 className="font-semibold text-sm text-[#2B302B] uppercase tracking-wider">
                Record Payment
              </h3>
              <button
                onClick={() => setIsPayModalOpen(false)}
                className="text-[#8A968A] hover:text-[#2B302B]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitPayment} className="space-y-4 text-xs">
              <div className="bg-[#F8FAF8] p-3 border border-[#CBD5CB] flex justify-between items-center">
                <span className="text-[#8A968A] uppercase">Outstanding Balance:</span>
                <span className="font-bold text-sm text-[#2B302B]">
                  {formatMoney(invoice.balance)}
                </span>
              </div>

              <div>
                <label className="block text-[#8A968A] uppercase mb-1">
                  Payment Amount (₹) * (Max: {invoice.balance})
                </label>
                <input
                  type="number"
                  min="1"
                  max={invoice.balance}
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full border border-[#CBD5CB] p-2 text-[#2B302B] focus:border-[#F57B4A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#8A968A] uppercase mb-1">Payment Method *</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                  className="w-full border border-[#CBD5CB] p-2 bg-white text-[#2B302B] focus:border-[#F57B4A] focus:outline-none"
                >
                  <option value="upi">UPI / QR</option>
                  <option value="credit_card">Credit / Debit Card</option>
                  <option value="wire_transfer">Bank Wire / NEFT</option>
                  <option value="direct_debit">Direct Debit (NACH)</option>
                  <option value="cash">Cash</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-[#8A968A] uppercase mb-1">Note / Reference</label>
                <input
                  type="text"
                  placeholder="e.g. Bank UTR / Cheque #"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  className="w-full border border-[#CBD5CB] p-2 text-[#2B302B] focus:border-[#F57B4A] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#CBD5CB]">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="px-4 py-2 border border-[#CBD5CB] text-[#2B302B] hover:bg-[#F4F7F4]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingPay}
                  className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white disabled:opacity-50"
                >
                  {loadingPay ? "Recording..." : "Confirm Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
