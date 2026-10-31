import React from "react";
import Link from "next/link";
import { requireAuth } from "@/lib/auth/session";
import { PageHeading } from "@/components/ui/page-heading";
import { KPICard } from "@/components/ui/kpi-card";
import { Badge } from "@/components/ui/badge";
import { createServerClient } from "@/lib/supabase/server";
import { formatMoney, formatDate, formatNumber } from "@/lib/formatters";
import {
  ShieldCheck,
  Repeat,
  Receipt,
  CreditCard,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
} from "lucide-react";

export const metadata = {
  title: "Customer Account — Brightloop",
  description: "Customer self-service portal for subscriptions and billing",
};

export default async function CustomerDashboardPage() {
  // Server-side authentication guard: strictly accessible by customer
  const { user, profile } = await requireAuth();

  // If admin or staff lands here, redirect to their home
  if (profile.role === "admin") {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-sm text-brightloop-sage">Admin account detected.</p>
        <Link href="/admin" className="text-brightloop-coral font-bold underline">
          Go to Administrator Console &rarr;
        </Link>
      </div>
    );
  }
  if (profile.role === "staff") {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-sm text-brightloop-sage">Staff account detected.</p>
        <Link href="/staff" className="text-brightloop-coral font-bold underline">
          Go to Operations Desk &rarr;
        </Link>
      </div>
    );
  }

  // Fetch real seeded customer subscriptions, invoices, and payments directly
  let subscriptions: any[] = [];
  let invoices: any[] = [];
  let payments: any[] = [];

  try {
    const supabase = createServerClient();
    const [subsRes, invsRes, paysRes] = await Promise.all([
      supabase
        .from("subscriptions")
        .select("id, status, current_period_start, current_period_end, created_at, plan:plans(name, price, interval)")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("invoices")
        .select("id, amount_due, status, due_date, created_at")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("payments")
        .select("id, amount, status, created_at")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

    if (subsRes.data) subscriptions = subsRes.data;
    if (invsRes.data) invoices = invsRes.data;
    if (paysRes.data) payments = paysRes.data;
  } catch (err) {
    console.error("Failed to query live customer data:", err);
  }

  const activeSubs = subscriptions.filter((s) => s.status === "active");
  const openInvoices = invoices.filter((i) => i.status === "open");
  const totalOutstanding = openInvoices.reduce(
    (sum, inv) => sum + Number(inv.amount_due || 0),
    0
  );
  const totalPaid = payments
    .filter((p) => p.status === "succeeded")
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Signature Page Heading */}
      <PageHeading
        title="CUSTOMER PORTAL"
        description="Self-service subscription management, receipts, and payment controls"
        badge={<Badge variant="sage">CUSTOMER ROLE</Badge>}
        actions={
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-brightloop-sage">
              Account:{" "}
              <strong className="text-brightloop-text">
                {profile.fullName || profile.email}
              </strong>
            </span>
          </div>
        }
      />

      {/* KPI Cards Row Reading Real Database Values */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard
          title="ACTIVE SUBSCRIPTIONS"
          value={formatNumber(activeSubs.length)}
          description={`${subscriptions.length} total contracts on file`}
          headerVariant="dark"
          icon={Repeat}
          showHexagon
        />

        <KPICard
          title="OUTSTANDING BALANCE"
          value={formatMoney(totalOutstanding)}
          description={
            totalOutstanding > 0
              ? `${openInvoices.length} open billing statements`
              : "Zero outstanding balance"
          }
          headerVariant={totalOutstanding > 0 ? "coral" : "sage"}
          icon={totalOutstanding > 0 ? AlertTriangle : Receipt}
        />

        <KPICard
          title="SETTLED PAYMENTS"
          value={formatMoney(totalPaid)}
          description={`${payments.length} successful payment records`}
          headerVariant="sage"
          icon={CreditCard}
        />
      </div>

      {/* Feature Navigation Cards - Quick jump to in-page sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-border bg-white p-5 shadow-card hover:shadow-hover transition-all space-y-3">
          <div className="w-9 h-9 rounded-md bg-brightloop-bg flex items-center justify-center text-brightloop-coral">
            <Repeat className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-brightloop-text">
              Active Subscriptions
            </h3>
            <p className="text-xs text-brightloop-sage leading-relaxed mt-1">
              Inspect current plan terms, billing frequencies, and renewal dates.
            </p>
          </div>
          <a
            href="#subscriptions"
            className="text-xs font-semibold text-brightloop-coral hover:underline inline-flex items-center gap-1 pt-1"
          >
            Manage plans &rarr;
          </a>
        </div>

        <div className="rounded-lg border border-border bg-white p-5 shadow-card hover:shadow-hover transition-all space-y-3">
          <div className="w-9 h-9 rounded-md bg-brightloop-bg flex items-center justify-center text-brightloop-coral">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-brightloop-text">
              Invoices & Receipts
            </h3>
            <p className="text-xs text-brightloop-sage leading-relaxed mt-1">
              Review complete historical billing records and settlement statuses.
            </p>
          </div>
          <a
            href="#invoices"
            className="text-xs font-semibold text-brightloop-coral hover:underline inline-flex items-center gap-1 pt-1"
          >
            View billing history &rarr;
          </a>
        </div>

        <div className="rounded-lg border border-border bg-white p-5 shadow-card hover:shadow-hover transition-all space-y-3">
          <div className="w-9 h-9 rounded-md bg-brightloop-bg flex items-center justify-center text-brightloop-coral">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-brightloop-text">
              Payment Methods
            </h3>
            <p className="text-xs text-brightloop-sage leading-relaxed mt-1">
              Review settled payment transactions and credit ledger records.
            </p>
          </div>
          <a
            href="#payments"
            className="text-xs font-semibold text-brightloop-coral hover:underline inline-flex items-center gap-1 pt-1"
          >
            Update cards &rarr;
          </a>
        </div>
      </div>

      {/* Live Subscriptions Table */}
      <div id="subscriptions" className="rounded-lg border border-border bg-white p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-brightloop-text">
              My Subscriptions ({subscriptions.length})
            </h3>
            <p className="text-xs text-brightloop-sage">
              Active recurring billing subscriptions assigned to this account
            </p>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#DDE5DB] text-[#1F2622] font-bold">
            {activeSubs.length} ACTIVE
          </span>
        </div>

        {subscriptions.length === 0 ? (
          <p className="text-xs text-brightloop-sage py-4 text-center">
            No active subscriptions found for this account.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-brightloop-sage uppercase font-mono text-[10px]">
                  <th className="py-2.5 font-semibold">Subscription ID</th>
                  <th className="py-2.5 font-semibold">Plan</th>
                  <th className="py-2.5 font-semibold">Status</th>
                  <th className="py-2.5 font-semibold">Period Start</th>
                  <th className="py-2.5 font-semibold">Next Renewal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-brightloop-bg/40 transition-colors">
                    <td className="py-2.5 font-mono font-medium text-brightloop-text">
                      {sub.id.slice(0, 18)}...
                    </td>
                    <td className="py-2.5 font-semibold text-brightloop-text">
                      {sub.plan?.name || "Enterprise Tier"}
                    </td>
                    <td className="py-2.5">
                      <span
                        className={
                          sub.status === "active"
                            ? "px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#DDE5DB] text-[#1F2622]"
                            : "px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800"
                        }
                      >
                        {sub.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-brightloop-sage">
                      {sub.current_period_start
                        ? formatDate(sub.current_period_start, "short")
                        : "—"}
                    </td>
                    <td className="py-2.5 font-semibold text-brightloop-text">
                      {sub.current_period_end
                        ? formatDate(sub.current_period_end, "short")
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Live Invoices Table */}
      <div id="invoices" className="rounded-lg border border-border bg-white p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-brightloop-text">
              Invoices & Statements ({invoices.length})
            </h3>
            <p className="text-xs text-brightloop-sage">
              Itemized billing invoices issued for your subscription usage
            </p>
          </div>
          {openInvoices.length > 0 && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-coral-100 text-[#F27B4B] font-bold">
              {openInvoices.length} DUE
            </span>
          )}
        </div>

        {invoices.length === 0 ? (
          <p className="text-xs text-brightloop-sage py-4 text-center">
            No invoices recorded for this account.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-brightloop-sage uppercase font-mono text-[10px]">
                  <th className="py-2.5 font-semibold">Invoice ID</th>
                  <th className="py-2.5 font-semibold">Issued Date</th>
                  <th className="py-2.5 font-semibold">Due Date</th>
                  <th className="py-2.5 font-semibold">Amount Due</th>
                  <th className="py-2.5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invoices.slice(0, 10).map((inv) => (
                  <tr key={inv.id} className="hover:bg-brightloop-bg/40 transition-colors">
                    <td className="py-2.5 font-mono font-medium text-brightloop-text">
                      {inv.id.slice(0, 18)}...
                    </td>
                    <td className="py-2.5 text-brightloop-sage">
                      {inv.created_at ? formatDate(inv.created_at, "short") : "—"}
                    </td>
                    <td className="py-2.5 text-brightloop-sage">
                      {inv.due_date ? formatDate(inv.due_date, "short") : "—"}
                    </td>
                    <td className="py-2.5 font-mono font-bold text-brightloop-text">
                      {formatMoney(Number(inv.amount_due || 0))}
                    </td>
                    <td className="py-2.5">
                      <span
                        className={
                          inv.status === "paid"
                            ? "px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800"
                            : "px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-coral-100 text-[#F27B4B]"
                        }
                      >
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Live Payments Table */}
      <div id="payments" className="rounded-lg border border-border bg-white p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-brightloop-text">
              Payment Transactions ({payments.length})
            </h3>
            <p className="text-xs text-brightloop-sage">
              Settled payment records and transaction confirmations
            </p>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#DDE5DB] text-[#1F2622] font-bold">
            {formatMoney(totalPaid)} SETTLED
          </span>
        </div>

        {payments.length === 0 ? (
          <p className="text-xs text-brightloop-sage py-4 text-center">
            No payments recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-brightloop-sage uppercase font-mono text-[10px]">
                  <th className="py-2.5 font-semibold">Payment ID</th>
                  <th className="py-2.5 font-semibold">Date</th>
                  <th className="py-2.5 font-semibold">Amount</th>
                  <th className="py-2.5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payments.map((pay) => (
                  <tr key={pay.id} className="hover:bg-brightloop-bg/40 transition-colors">
                    <td className="py-2.5 font-mono font-medium text-brightloop-text">
                      {pay.id.slice(0, 18)}...
                    </td>
                    <td className="py-2.5 text-brightloop-sage">
                      {pay.created_at ? formatDate(pay.created_at, "short") : "—"}
                    </td>
                    <td className="py-2.5 font-mono font-bold text-brightloop-text">
                      {formatMoney(Number(pay.amount || 0))}
                    </td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                        {pay.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Security Notice */}
      <div className="rounded-lg border border-border bg-white p-5 flex items-start gap-3.5 shadow-subtle">
        <ShieldCheck className="w-5 h-5 text-brightloop-coral shrink-0 mt-0.5" />
        <div className="text-xs text-brightloop-text space-y-1">
          <p className="font-bold uppercase tracking-wider text-brightloop-text">
            Account Isolation & Security
          </p>
          <p className="text-brightloop-sage leading-relaxed">
            All records displayed above are protected by strict PostgreSQL Row Level Security (RLS). You only have access to records linked directly to your authenticated customer profile.
          </p>
        </div>
      </div>
    </div>
  );
}
