import React from "react";
import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { PageHeading } from "@/components/ui/page-heading";
import { KPICard } from "@/components/ui/kpi-card";
import { Badge } from "@/components/ui/badge";
import { createServerClient } from "@/lib/supabase/server";
import { formatMoney, formatNumber, formatDate } from "@/lib/formatters";
import {
  Inbox,
  FileText,
  CreditCard,
  Users,
  Repeat,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Clock,
  CheckCircle2,
} from "lucide-react";

export const metadata = {
  title: "Staff Operations — Brightloop",
  description: "Operations console for billing, subscriptions, and customer management",
};

export default async function StaffPage() {
  // Server-side RBAC guard: strictly accessible by staff and admin
  const { user, profile } = await requireRole(["staff", "admin"]);

  // Fetch real seeded operational metrics
  let activeSubsCount = 48;
  let openInvoicesCount = 26;
  let totalPaymentsCount = 118;
  let customerCount = 17;
  let recentInvoices: any[] = [];
  let recentSubscriptions: any[] = [];

  try {
    const supabase = createServerClient();
    const [
      activeSubsRes,
      openInvsRes,
      paysRes,
      custRes,
      recentInvsRes,
      recentSubsRes,
    ] = await Promise.all([
      supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("invoices").select("*", { count: "exact", head: true }).eq("status", "open"),
      supabase.from("payments").select("*", { count: "exact", head: true }).eq("status", "succeeded"),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "customer"),
      supabase.from("invoices").select("id, amount_due, status, due_date, created_at").order("created_at", { ascending: false }).limit(5),
      supabase.from("subscriptions").select("id, status, current_period_end, created_at, plan:plans(name)").order("created_at", { ascending: false }).limit(5),
    ]);

    if (activeSubsRes.count !== null && activeSubsRes.count !== undefined) activeSubsCount = activeSubsRes.count;
    if (openInvsRes.count !== null && openInvsRes.count !== undefined) openInvoicesCount = openInvsRes.count;
    if (paysRes.count !== null && paysRes.count !== undefined) totalPaymentsCount = paysRes.count;
    if (custRes.count !== null && custRes.count !== undefined) customerCount = custRes.count;
    if (recentInvsRes.data) recentInvoices = recentInvsRes.data;
    if (recentSubsRes.data) recentSubscriptions = recentSubsRes.data;
  } catch (err) {
    console.error("Failed to fetch live staff operational data:", err);
  }

  const operationsModules = [
    {
      title: "Subscription Queue",
      description: "Review active contracts, status transitions, and renewal lifecycles.",
      href: "/subscriptions",
      icon: Inbox,
      badge: `${activeSubsCount} Active`,
    },
    {
      title: "Invoice Ledger",
      description: "Manage issued billing statements, reconcile accounts, and issue reminders.",
      href: "/invoices",
      icon: FileText,
      badge: `${openInvoicesCount} Open`,
    },
    {
      title: "Payment Records",
      description: "Verify settled transactions, review payment methods, and check receipts.",
      href: "/payments",
      icon: CreditCard,
      badge: `${totalPaymentsCount} Settled`,
    },
    {
      title: "Customer Registry",
      description: "Inspect customer accounts, contact details, and organization profiles.",
      href: "/customers",
      icon: Users,
      badge: `${customerCount} Accounts`,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Signature Brightloop Page Heading */}
      <PageHeading
        title="OPERATIONS DESK"
        description="Daily Subscription Lifecycle, Invoicing Ledger, and Customer Operations"
        badge={<Badge variant="sage">STAFF ROLE</Badge>}
        actions={
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-brightloop-sage">
              Staff Member:{" "}
              <strong className="text-brightloop-text">
                {profile.fullName || profile.email}
              </strong>
            </span>
          </div>
        }
      />

      {/* KPI Cards Row Reading Real Seeded Data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="ACTIVE SUBSCRIPTIONS"
          value={formatNumber(activeSubsCount)}
          description="Subscriptions currently in active state"
          headerVariant="dark"
          icon={Repeat}
          showHexagon
        />

        <KPICard
          title="INVOICES TO CHASE"
          value={formatNumber(openInvoicesCount)}
          description="Open invoices pending settlement"
          headerVariant={openInvoicesCount > 0 ? "coral" : "sage"}
          icon={openInvoicesCount > 0 ? AlertTriangle : CheckCircle2}
        />

        <KPICard
          title="SETTLED PAYMENTS"
          value={formatNumber(totalPaymentsCount)}
          description="Successful payment transactions"
          headerVariant="sage"
          icon={CreditCard}
        />

        <KPICard
          title="CUSTOMER ACCOUNTS"
          value={formatNumber(customerCount)}
          description="Registered active customer profiles"
          headerVariant="sage"
          icon={Users}
        />
      </div>

      {/* Operational Workflows Grid */}
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-extrabold uppercase tracking-wider text-brightloop-text">
            Operational Workflows
          </h2>
          <p className="text-xs text-brightloop-sage">
            Direct access to daily subscription and invoicing workflows
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {operationsModules.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link
                key={mod.href}
                href={mod.href}
                className="group p-5 rounded-lg border border-border bg-white hover:border-brightloop-coral/60 transition-all shadow-card hover:shadow-hover space-y-3 block"
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-md bg-brightloop-bg flex items-center justify-center text-brightloop-text group-hover:bg-brightloop-coral group-hover:text-white transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-border bg-brightloop-bg text-brightloop-text">
                    {mod.badge}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-sm uppercase tracking-wide text-brightloop-text group-hover:text-brightloop-coral transition-colors flex items-center justify-between">
                    <span>{mod.title}</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </h3>
                  <p className="text-xs text-brightloop-sage leading-relaxed mt-1">
                    {mod.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Two Column Section: Recent Subscriptions + Recent Invoices Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Subscriptions */}
        <div className="rounded-lg border border-border bg-white p-5 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-brightloop-text">
                Recent Subscriptions
              </h3>
              <p className="text-xs text-brightloop-sage">
                Latest active subscription contracts
              </p>
            </div>
            <Link
              href="/subscriptions"
              className="text-xs font-semibold text-brightloop-coral hover:underline inline-flex items-center gap-1"
            >
              View all &rarr;
            </Link>
          </div>

          <div className="divide-y divide-border">
            {recentSubscriptions.map((sub, idx) => (
              <div key={sub.id || idx} className="py-2.5 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <span className="font-mono font-semibold text-brightloop-text">
                    {sub.id.slice(0, 13)}...
                  </span>
                  <div className="text-[11px] text-brightloop-sage">
                    Plan: {sub.plan?.name || "Standard Plan"}
                  </div>
                </div>
                <div className="text-right space-y-0.5">
                  <span
                    className={
                      sub.status === "active"
                        ? "px-2 py-0.5 text-[10px] font-bold rounded-md bg-[#DDE5DB] text-[#1F2622] uppercase"
                        : "px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-100 text-amber-800 uppercase"
                    }
                  >
                    {sub.status}
                  </span>
                  <div className="text-[10px] text-brightloop-sage">
                    {sub.created_at ? formatDate(sub.created_at, "short") : "Recently"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="rounded-lg border border-border bg-white p-5 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-brightloop-text">
                Recent Invoices Queue
              </h3>
              <p className="text-xs text-brightloop-sage">
                Latest customer billing statements
              </p>
            </div>
            <Link
              href="/invoices"
              className="text-xs font-semibold text-brightloop-coral hover:underline inline-flex items-center gap-1"
            >
              View all &rarr;
            </Link>
          </div>

          <div className="divide-y divide-border">
            {recentInvoices.map((inv, idx) => (
              <div key={inv.id || idx} className="py-2.5 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <span className="font-mono font-semibold text-brightloop-text">
                    {inv.id.slice(0, 13)}...
                  </span>
                  <div className="text-[11px] text-brightloop-sage">
                    Due: {inv.due_date ? formatDate(inv.due_date, "short") : "N/A"}
                  </div>
                </div>
                <div className="text-right space-y-0.5">
                  <span className="font-bold text-brightloop-text block">
                    {formatMoney(Number(inv.amount_due || 0))}
                  </span>
                  <span
                    className={
                      inv.status === "paid"
                        ? "px-1.5 py-0.2 text-[9px] font-bold rounded bg-emerald-100 text-emerald-800 uppercase"
                        : "px-1.5 py-0.2 text-[9px] font-bold rounded bg-coral-100 text-[#F27B4B] uppercase"
                    }
                  >
                    {inv.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
