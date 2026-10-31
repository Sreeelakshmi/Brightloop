"use client";

import * as React from "react";
import { Payment, Invoice, PaymentMethod } from "@/types";
import { PageHeader, StatusBadge } from "@/components/ui-shared";
import { formatMoney } from "@/lib/formatters";
import Link from "next/link";
import { CreditCard, Plus, CheckCircle2, AlertTriangle, ExternalLink } from "lucide-react";
import { handleRecordPayment } from "@/app/actions/billing-actions";

interface PaymentsClientProps {
  initialPayments: Payment[];
  unpaidInvoices: Invoice[];
  isAdmin: boolean;
}

export function PaymentsClient({
  initialPayments,
  unpaidInvoices,
  isAdmin,
}: PaymentsClientProps) {
  const [payments, setPayments] = React.useState<Payment[]>(initialPayments);
  const [methodFilter, setMethodFilter] = React.useState<string>("all");
  const [search, setSearch] = React.useState<string>("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = React.useState<string>(
    unpaidInvoices[0]?.id || ""
  );
  const [amount, setAmount] = React.useState<string>(
    unpaidInvoices[0] ? String(unpaidInvoices[0].balance) : "1000"
  );
  const [method, setMethod] = React.useState<PaymentMethod>("upi");
  const [reference, setReference] = React.useState("");
  const [note, setNote] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  const selectedInvoice = unpaidInvoices.find((i) => i.id === selectedInvoiceId);

  // Method summary calculations for the 3-segment summary line
  const summaryByMethod = React.useMemo(() => {
    let totalAll = 0;
    let upiTotal = 0;
    let cardTotal = 0;
    let wireTotal = 0;

    for (const p of payments) {
      totalAll += p.amount;
      if (p.method === "upi") upiTotal += p.amount;
      else if (p.method === "credit_card") cardTotal += p.amount;
      else wireTotal += p.amount;
    }

    return { totalAll, upiTotal, cardTotal, wireTotal };
  }, [payments]);

  const filtered = React.useMemo(() => {
    return payments.filter((p) => {
      if (methodFilter !== "all" && p.method !== methodFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          p.paymentNo.toLowerCase().includes(q) ||
          p.invoiceNo?.toLowerCase().includes(q) ||
          p.customer?.name.toLowerCase().includes(q) ||
          p.reference.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [payments, methodFilter, search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceId) {
      setErrorMsg("Please select an invoice.");
      return;
    }
    setErrorMsg(null);
    setLoading(true);

    const res = await handleRecordPayment({
      invoiceId: selectedInvoiceId,
      amount: Number(amount),
      method,
      reference,
      note,
    });

    setLoading(false);
    if (res.success && res.payment) {
      setPayments([res.payment, ...payments]);
      setIsModalOpen(false);
      setSuccessMsg(`Payment ${res.payment.paymentNo} for ${formatMoney(res.payment.amount)} recorded!`);
    } else {
      setErrorMsg(res.error || "Failed to record payment");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-mono">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader
          title="PAYMENT TRANSACTIONS"
          subtitle="Settlement Reconciliation, Multi-Gateway Ingestion & Ledger"
          logDate="31.10.2026"
        />
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#2B302B] hover:bg-black text-[#E4EEE4] px-4 py-2 text-xs font-mono tracking-wider uppercase border border-[#2B302B] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Record Payment
        </button>
      </div>

      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-800 p-3 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* THREE-SEGMENT SUMMARY LINE OF TOTALS BY METHOD */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-[#2B302B] p-4">
          <div className="text-[10px] uppercase font-bold text-[#8A968A]">Total Collections</div>
          <div className="text-xl font-bold text-[#2B302B] mt-1">
            {formatMoney(summaryByMethod.totalAll)}
          </div>
          <div className="text-[10px] text-[#8A968A] mt-0.5">Across all gateways</div>
        </div>

        <div className="bg-white border border-[#CBD5CB] p-4">
          <div className="text-[10px] uppercase font-bold text-[#8A968A]">UPI & Digital (QR)</div>
          <div className="text-xl font-bold text-[#2B302B] mt-1">
            {formatMoney(summaryByMethod.upiTotal)}
          </div>
          <div className="text-[10px] text-[#8A968A] mt-0.5">Instant settlement</div>
        </div>

        <div className="bg-white border border-[#CBD5CB] p-4">
          <div className="text-[10px] uppercase font-bold text-[#8A968A]">Cards (Credit / Debit)</div>
          <div className="text-xl font-bold text-[#2B302B] mt-1">
            {formatMoney(summaryByMethod.cardTotal)}
          </div>
          <div className="text-[10px] text-[#8A968A] mt-0.5">Visa / Mastercard / RuPay</div>
        </div>

        <div className="bg-white border border-[#CBD5CB] p-4">
          <div className="text-[10px] uppercase font-bold text-[#8A968A]">Wire & Direct Debit</div>
          <div className="text-xl font-bold text-[#2B302B] mt-1">
            {formatMoney(summaryByMethod.wireTotal)}
          </div>
          <div className="text-[10px] text-[#8A968A] mt-0.5">NEFT / RTGS / NACH</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-[#CBD5CB] p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {["all", "upi", "credit_card", "wire_transfer", "direct_debit"].map((m) => (
            <button
              key={m}
              onClick={() => setMethodFilter(m)}
              className={`px-3 py-1 text-xs uppercase transition-colors border ${
                methodFilter === m
                  ? "bg-[#2B302B] text-white border-[#2B302B]"
                  : "bg-[#F8FAF8] text-[#2B302B] border-[#CBD5CB] hover:bg-[#E4EEE4]"
              }`}
            >
              {m.replace(/_/g, " ")}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search by payment #, invoice, or ref..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-[#CBD5CB] px-3 py-1.5 w-64 text-xs text-[#2B302B] focus:outline-none focus:border-[#F57B4A]"
        />
      </div>

      {/* Payments Table */}
      <div className="bg-white border border-[#CBD5CB] overflow-hidden">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-[#E4EEE4] border-b border-[#CBD5CB] text-[#2B302B] uppercase">
            <tr>
              <th className="p-3">Payment #</th>
              <th className="p-3">Invoice #</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Method</th>
              <th className="p-3">Payment Date</th>
              <th className="p-3">Reference / Note</th>
              <th className="p-3 text-right">Amount</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E4EEE4]">
            {filtered.slice(0, 50).map((p) => (
              <tr key={p.id} className="hover:bg-[#F8FAF8] transition-colors">
                <td className="p-3 font-bold text-[#2B302B]">{p.paymentNo}</td>
                <td className="p-3 font-semibold text-[#2B302B]">
                  <Link
                    href={`/invoices/${p.invoiceId}`}
                    className="hover:text-[#F57B4A] underline flex items-center gap-1"
                  >
                    {p.invoiceNo || p.invoiceId}
                    <ExternalLink className="w-3 h-3 opacity-60" />
                  </Link>
                </td>
                <td className="p-3">
                  <div className="font-semibold text-[#2B302B]">{p.customer?.name}</div>
                  <div className="text-[10px] text-[#8A968A]">{p.customer?.company}</div>
                </td>
                <td className="p-3 uppercase">
                  <span className="bg-[#E4EEE4] px-2 py-0.5 text-[10px] text-[#2B302B] font-semibold">
                    {p.method.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="p-3 text-[#2B302B]">
                  {new Date(p.paymentDate).toLocaleDateString("en-IN")}
                </td>
                <td className="p-3 text-[#8A968A] text-[11px]">
                  <span>{p.reference}</span>
                  {p.note && <span className="block text-[#2B302B]">&ldquo;{p.note}&rdquo;</span>}
                </td>
                <td className="p-3 text-right font-bold text-green-700">
                  {formatMoney(p.amount)}
                </td>
                <td className="p-3">
                  <span className="text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 text-[10px] uppercase font-bold">
                    {p.status}
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-[#8A968A]">
                  No payment transactions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Record Payment Modal with Overpayment Prevention */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#2B302B] w-full max-w-md p-6 space-y-4 font-mono shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#CBD5CB] pb-3">
              <h3 className="font-semibold text-sm text-[#2B302B] uppercase tracking-wider">
                Record Payment
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#8A968A] hover:text-[#2B302B]"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-2.5 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#8A968A] uppercase mb-1">Select Invoice *</label>
                <select
                  value={selectedInvoiceId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedInvoiceId(id);
                    const inv = unpaidInvoices.find((i) => i.id === id);
                    if (inv) setAmount(String(inv.balance));
                  }}
                  className="w-full border border-[#CBD5CB] p-2 bg-white text-[#2B302B] focus:border-[#F57B4A] focus:outline-none"
                >
                  {unpaidInvoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNo} - {inv.customer?.company} (Balance: {formatMoney(inv.balance)})
                    </option>
                  ))}
                </select>
              </div>

              {selectedInvoice && (
                <div className="bg-[#F8FAF8] p-3 border border-[#CBD5CB] flex justify-between items-center">
                  <span className="text-[#8A968A] uppercase">Max Payable Balance:</span>
                  <span className="font-bold text-[#2B302B]">
                    {formatMoney(selectedInvoice.balance)}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-[#8A968A] uppercase mb-1">
                  Payment Amount (₹) * (Overpayment will be rejected)
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedInvoice?.balance || 999999}
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full border border-[#CBD5CB] p-2 text-[#2B302B] focus:border-[#F57B4A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#8A968A] uppercase mb-1">Payment Method *</label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as PaymentMethod)}
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
                <label className="block text-[#8A968A] uppercase mb-1">Transaction Ref</label>
                <input
                  type="text"
                  placeholder="e.g. UTR / Receipt No."
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full border border-[#CBD5CB] p-2 text-[#2B302B] focus:border-[#F57B4A] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#CBD5CB]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-[#CBD5CB] text-[#2B302B] hover:bg-[#F4F7F4]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white disabled:opacity-50"
                >
                  {loading ? "Recording..." : "Save Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
