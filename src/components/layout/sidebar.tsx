"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  Layers,
  Users,
  UserCheck,
  FileSpreadsheet,
  Repeat,
  Receipt,
  CreditCard,
  Settings,
  ShieldCheck,
  ExternalLink,
  Shield,
} from "lucide-react";

interface NavLinkItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  member: string;
}

const mainNavItems: NavLinkItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, member: "M4" },
  { name: "Admin Console", href: "/admin", icon: Shield, member: "M1" },
  { name: "Products", href: "/products", icon: Package, member: "M1" },
  { name: "Plans", href: "/plans", icon: Layers, member: "M1" },
  { name: "Customers", href: "/customers", icon: Users, member: "M1" },
  { name: "Staff", href: "/staff", icon: UserCheck, member: "M1" },
];

const subscriptionNavItems: NavLinkItem[] = [
  { name: "Quotations", href: "/quotations", icon: FileSpreadsheet, member: "M2" },
  { name: "Subscriptions", href: "/subscriptions", icon: Repeat, member: "M2" },
];

const billingNavItems: NavLinkItem[] = [
  { name: "Invoices", href: "/invoices", icon: Receipt, member: "M3" },
  { name: "Payments", href: "/payments", icon: CreditCard, member: "M3" },
];

const systemNavItems: NavLinkItem[] = [
  { name: "Settings", href: "/settings", icon: Settings, member: "M1" },
];

export function Sidebar() {
  const pathname = usePathname();

  const renderNavGroup = (title: string, items: NavLinkItem[]) => (
    <div className="py-2.5">
      <h3 className="px-3 text-[11px] font-bold text-brightloop-sage uppercase tracking-wider mb-1.5">
        {title}
      </h3>
      <div className="space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-md transition-all group",
                isActive
                  ? "bg-brightloop-bg text-brightloop-text shadow-subtle border border-brightloop-border/80 font-bold"
                  : "text-brightloop-text/80 hover:bg-brightloop-bg/50 hover:text-brightloop-text"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all",
                    isActive ? "bg-brightloop-coral scale-125" : "bg-transparent group-hover:bg-brightloop-sage/40"
                  )}
                />
                <Icon
                  className={cn(
                    "w-4 h-4 shrink-0 transition-colors",
                    isActive
                      ? "text-brightloop-coral"
                      : "text-brightloop-sage group-hover:text-brightloop-text"
                  )}
                />
                <span>{item.name}</span>
              </div>
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded font-mono font-medium border",
                  isActive
                    ? "bg-white text-brightloop-text border-brightloop-border"
                    : "bg-brightloop-bg/40 text-brightloop-sage border-transparent group-hover:border-brightloop-border"
                )}
              >
                {item.member}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );

  return (
    <aside className="w-64 border-r border-border bg-white flex flex-col shrink-0 h-screen sticky top-0 shadow-subtle z-20">
      {/* Brand Logo Header */}
      <div className="h-16 flex items-center px-6 border-b border-border gap-3 bg-white">
        <div className="w-9 h-9 rounded-lg bg-brightloop-coral flex items-center justify-center text-white shadow-sm">
          <Repeat className="w-5 h-5" />
        </div>
        <div>
          <span className="font-extrabold text-base uppercase tracking-wider text-brightloop-text block leading-tight">
            Brightloop
          </span>
          <span className="text-[11px] font-medium text-brightloop-sage uppercase tracking-wider">
            Subscription OS
          </span>
        </div>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {renderNavGroup("Core Management", mainNavItems)}
        {renderNavGroup("Subscription Lifecycle", subscriptionNavItems)}
        {renderNavGroup("Billing & Finance", billingNavItems)}
        {renderNavGroup("System & Org", systemNavItems)}
      </nav>

      {/* Customer Portal Shortcut & Footer */}
      <div className="p-3 border-t border-border bg-white space-y-2">
        <Link
          href="/customer"
          className="flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-md text-brightloop-text bg-brightloop-bg/40 hover:bg-brightloop-bg transition-colors border border-border"
        >
          <span className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-brightloop-coral" />
            Customer Portal
          </span>
          <ExternalLink className="w-3 h-3 text-brightloop-sage" />
        </Link>
        <div className="px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-brightloop-sage">
          Brightloop • Theme v1.0
        </div>
      </div>
    </aside>
  );
}
