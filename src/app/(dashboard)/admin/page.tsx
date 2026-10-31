import React from "react";
import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { PageHeading } from "@/components/ui/page-heading";
import { KPICard } from "@/components/ui/kpi-card";
import { Badge } from "@/components/ui/badge";
import {
  ShieldAlert,
  ShieldCheck,
  Package,
  Layers,
  Users,
  UserCheck,
  Settings,
  BarChart3,
  ArrowRight,
  Database,
  Lock,
} from "lucide-react";

export const metadata = {
  title: "Admin Console — Brightloop",
  description: "Administrator management console for Brightloop",
};

export default async function AdminPage() {
  // Server-side role guard: strictly restricted to admin role
  const { user, profile } = await requireRole(["admin"]);

  const adminModules = [
    {
      title: "Product Catalog",
      description: "Manage products, SKUs, and service tiers.",
      href: "/products",
      icon: Package,
      member: "Member 1",
    },
    {
      title: "Subscription Plans",
      description: "Configure billing intervals, currencies, and pricing rules.",
      href: "/plans",
      icon: Layers,
      member: "Member 1",
    },
    {
      title: "Customer Directory",
      description: "Inspect customer accounts, subscriptions, and organizations.",
      href: "/customers",
      icon: Users,
      member: "Member 1",
    },
    {
      title: "Staff & Permissions",
      description: "Assign user roles, manage team invites, and inspect access logs.",
      href: "/staff",
      icon: UserCheck,
      member: "Member 1",
    },
    {
      title: "System Settings",
      description: "Manage API credentials, organization parameters, and system defaults.",
      href: "/settings",
      icon: Settings,
      member: "Member 1",
    },
    {
      title: "Executive Dashboard",
      description: "Review real-time subscription analytics, MRR, and AI insights.",
      href: "/dashboard",
      icon: BarChart3,
      member: "Member 4",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Signature Brightloop Page Heading */}
      <PageHeading
        title="ADMINISTRATOR CONSOLE"
        description="Global Subscription Control & Infrastructure Management"
        badge={<Badge variant="dark">ADMIN ROLE</Badge>}
        actions={
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-brightloop-sage">
              Logged in as:{" "}
              <strong className="text-brightloop-text">
                {profile.fullName || profile.email}
              </strong>
            </span>
          </div>
        }
      />

      {/* KPI Cards Row Matching Official Brightloop Reference */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="DATABASE RLS"
          value="ENFORCED"
          description="PostgreSQL Row Level Security"
          headerVariant="dark"
          showHexagon
        />

        <KPICard
          title="ACTIVE SESSIONS"
          value="SSR VERIFIED"
          description="HttpOnly secure cookie sessions"
          headerVariant="sage"
          icon={Lock}
        />

        <KPICard
          title="STAFF ROSTER"
          value="PROTECTED"
          description="Server-side RBAC validation"
          headerVariant="sage"
          icon={UserCheck}
        />

        <KPICard
          title="ADMIN PRIVILEGES"
          value="ACTIVE"
          description="Full system & catalog access"
          headerVariant="coral"
          icon={ShieldCheck}
        />
      </div>

      {/* Administration Modules Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold uppercase tracking-wider text-brightloop-text">
              Management Modules
            </h2>
            <p className="text-xs text-brightloop-sage">
              Core system resources and administrative workflows
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {adminModules.map((mod) => {
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
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded border border-border bg-brightloop-bg/40 text-brightloop-sage">
                      {mod.member}
                    </span>
                    <ArrowRight className="w-4 h-4 text-brightloop-sage group-hover:text-brightloop-coral group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-sm uppercase tracking-wide text-brightloop-text group-hover:text-brightloop-coral transition-colors">
                    {mod.title}
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
    </div>
  );
}
