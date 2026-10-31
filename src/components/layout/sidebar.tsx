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
    <div className="py-2">
      <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
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
                "flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors group",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    "w-4 h-4 shrink-0 transition-colors",
                    isActive
                      ? "text-primary-foreground"
                      : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                <span>{item.name}</span>
              </div>
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded font-mono font-medium",
                  isActive
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground group-hover:bg-accent"
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
    <aside className="w-64 border-r bg-card flex flex-col shrink-0 h-screen sticky top-0">
      {/* Brand Logo Header */}
      <div className="h-16 flex items-center px-6 border-b gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
          <Repeat className="w-5 h-5" />
        </div>
        <div>
          <span className="font-bold text-base tracking-tight text-foreground block leading-tight">
            Brightloop
          </span>
          <span className="text-[11px] text-muted-foreground">Subscription OS</span>
        </div>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
        {renderNavGroup("Core Management", mainNavItems)}
        {renderNavGroup("Subscription Lifecycle", subscriptionNavItems)}
        {renderNavGroup("Billing & Finance", billingNavItems)}
        {renderNavGroup("System & Org", systemNavItems)}
      </nav>

      {/* Customer Portal Shortcut & Footer */}
      <div className="p-3 border-t bg-muted/20 space-y-2">
        <Link
          href="/portal"
          className="flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors border"
        >
          <span className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            Customer Portal
          </span>
          <ExternalLink className="w-3 h-3 text-muted-foreground" />
        </Link>
        <div className="px-3 py-1 text-[11px] text-muted-foreground">
          Hackathon Skeleton v0.1.0
        </div>
      </div>
    </aside>
  );
}
