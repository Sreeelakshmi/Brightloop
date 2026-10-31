"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui-shared/Logo";
import { UserRole } from "@/types";
import {
  Home,
  BarChart2,
  Users,
  Inbox,
  FileText,
  CreditCard,
  Menu,
  Package,
  Layers,
  FileSpreadsheet,
  UserCheck,
  Settings,
  ShieldCheck,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const primaryNav: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Reports", href: "/reports", icon: BarChart2 },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Subscriptions", href: "/subscriptions", icon: Inbox },
  { name: "Invoices", href: "/invoices", icon: FileText },
  { name: "Payments", href: "/payments", icon: CreditCard },
];

const secondaryNav: NavItem[] = [
  { name: "Products", href: "/products", icon: Package },
  { name: "Plans", href: "/plans", icon: Layers },
  { name: "Quotations", href: "/quotations", icon: FileSpreadsheet },
  { name: "Staff", href: "/staff", icon: UserCheck },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({ role = "admin" }: { role?: UserRole }) {
  const pathname = usePathname();

  const isItemActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard" || pathname === "/";
    }
    return pathname.startsWith(href);
  };

  // Filter out settings for non-admin users
  const filteredSecondaryNav = secondaryNav.filter((item) => {
    if (role === "staff" && item.href === "/settings") {
      return false;
    }
    return true;
  });

  const adminNav: NavItem[] =
    role === "admin"
      ? [{ name: "Admin Console", href: "/admin", icon: ShieldCheck }]
      : [];

  const renderNavLinks = (items: NavItem[]) => (
    <div className="space-y-1">
      {items.map((item) => {
        const active = isItemActive(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3.5 py-2 text-sm font-semibold rounded-lg transition-all group relative",
              active
                ? "bg-[#EBF1EA] text-[#F27B4B] border-l-[3px] border-[#F27B4B] rounded-l-none pl-3 font-bold"
                : "text-[#1F2622]/85 hover:bg-[#EBF1EA]/60 hover:text-[#1F2622]"
            )}
          >
            <Icon
              className={cn(
                "w-4 h-4 shrink-0 transition-colors",
                active
                  ? "text-[#F27B4B]"
                  : "text-[#8C9B8E] group-hover:text-[#1F2622]"
              )}
            />
            <span className="truncate">{item.name}</span>
          </Link>
        );
      })}
    </div>
  );

  return (
    <aside className="w-60 border-r border-[#D5DDD2] bg-white flex flex-col shrink-0 h-screen sticky top-0 z-20 select-none">
      {/* Brand Logo Header */}
      <div className="h-16 flex items-center px-5 border-b border-[#D5DDD2]/70 bg-white">
        <Logo size="default" href={role === "admin" ? "/admin" : "/staff"} />
      </div>

      {/* Navigation Body */}
      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
        {/* Admin Console Shortcut if Admin */}
        {adminNav.length > 0 && (
          <div>
            <div className="flex items-center gap-2 px-3 pb-2 text-xs font-bold text-[#8C9B8E] uppercase tracking-wider">
              <span>Administration</span>
            </div>
            {renderNavLinks(adminNav)}
          </div>
        )}

        {/* Menu Section Header */}
        <div>
          <div className="flex items-center gap-2 px-3 pb-2 text-xs font-bold text-[#8C9B8E] uppercase tracking-wider">
            <Menu className="w-3.5 h-3.5 text-[#1F2622]" />
            <span>Menu</span>
          </div>
          {renderNavLinks(primaryNav)}
        </div>

        {/* Divider with Center Diamond Node */}
        <div className="relative py-2 px-3">
          <div className="h-[1px] w-full bg-[#D5DDD2]" />
          <div className="absolute left-1/2 -top-[1px] -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#8C9B8E]" />
        </div>

        {/* Secondary Modules */}
        <div>
          <div className="px-3 pb-2 text-[11px] font-bold text-[#8C9B8E] uppercase tracking-wider">
            Operations
          </div>
          {renderNavLinks(filteredSecondaryNav)}
        </div>
      </nav>

      {/* Footer Status Display */}
      <div className="p-3 border-t border-[#D5DDD2] bg-white space-y-2">
        <div className="flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg text-[#1F2622] bg-[#EBF1EA]/60 border border-[#D5DDD2]">
          <span className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[#F27B4B]" />
            <span className="uppercase">{role} Space</span>
          </span>
          <span className="text-[10px] font-mono text-[#8C9B8E]">v1.0</span>
        </div>
        <div className="px-2 text-[10px] text-[#8C9B8E] font-medium uppercase tracking-wider text-center">
          Brightloop • Revenue Overview
        </div>
      </div>
    </aside>
  );
}
