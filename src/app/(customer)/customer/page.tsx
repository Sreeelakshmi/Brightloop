import React from "react";
import Link from "next/link";
import { requireAuth } from "@/lib/auth/session";
import { PageHeading } from "@/components/ui/page-heading";
import { KPICard } from "@/components/ui/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  Repeat,
  Receipt,
  CreditCard,
  ArrowRight,
} from "lucide-react";

export const metadata = {
  title: "Customer Account — Brightloop",
  description: "Customer self-service portal for subscriptions and billing",
};

export default async function CustomerDashboardPage() {
  // Server-side authentication guard
  const { user, profile } = await requireAuth();

  return (
    <div className="space-y-8">
      {/* Signature Page Heading */}
      <PageHeading
        title="CUSTOMER PORTAL"
        description="Self-service subscription management, receipts, and payment controls"
        badge={<Badge variant="sage">CUSTOMER ROLE</Badge>}
        actions={
          <Button asChild variant="coral" className="flex items-center gap-2">
            <Link href="/portal">
              <span>Open Subscription Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        }
      />

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard
          title="ACTIVE SUBSCRIPTIONS"
          value="1"
          description="Standard monthly billing plan"
          headerVariant="dark"
          icon={Repeat}
          showHexagon
        />

        <KPICard
          title="INVOICE STATUS"
          value="PAID"
          description="Zero outstanding balance"
          headerVariant="sage"
          icon={Receipt}
        />

        <KPICard
          title="ACCOUNT PRIVACY"
          value="SECURED"
          description="Row Level Security enforced"
          headerVariant="coral"
          icon={ShieldCheck}
        />
      </div>

      {/* Feature Cards Grid */}
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
              Inspect current plan terms, billing frequencies, and upgrade options.
            </p>
          </div>
          <Link
            href="/portal"
            className="text-xs font-semibold text-brightloop-coral hover:underline inline-flex items-center gap-1 pt-1"
          >
            Manage plans &rarr;
          </Link>
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
              Download PDF invoices and review complete historical payment records.
            </p>
          </div>
          <Link
            href="/portal"
            className="text-xs font-semibold text-brightloop-coral hover:underline inline-flex items-center gap-1 pt-1"
          >
            View billing history &rarr;
          </Link>
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
              Securely update payment cards, billing address, and receipts email.
            </p>
          </div>
          <Link
            href="/portal"
            className="text-xs font-semibold text-brightloop-coral hover:underline inline-flex items-center gap-1 pt-1"
          >
            Update cards &rarr;
          </Link>
        </div>
      </div>

      {/* Security Notice */}
      <div className="rounded-lg border border-border bg-white p-5 flex items-start gap-3.5 shadow-subtle">
        <ShieldCheck className="w-5 h-5 text-brightloop-coral shrink-0 mt-0.5" />
        <div className="text-xs text-brightloop-text space-y-1">
          <p className="font-bold uppercase tracking-wider text-brightloop-text">
            Account Isolation & Security
          </p>
          <p className="text-brightloop-sage leading-relaxed">
            Your customer account is strictly isolated using Supabase PostgreSQL Row Level Security (RLS). You can only access and view data that belongs directly to your account.
          </p>
        </div>
      </div>
    </div>
  );
}
