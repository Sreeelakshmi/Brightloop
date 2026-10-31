"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui-shared/Logo";
import { AuthUser } from "@/lib/auth";
import {
  LayoutDashboard,
  BarChart3,
  Users,
  Layers,
  FileText,
  CreditCard,
  Menu,
  ChevronLeft,
  ChevronRight,
  Shield,
  X,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Reports",
    href: "/reports",
    icon: BarChart3,
  },
  {
    title: "Customers",
    href: "/customers",
    icon: Users,
  },
  {
    title: "Subscriptions",
    href: "/subscriptions",
    icon: Layers,
  },
  {
    title: "Invoices",
    href: "/invoices",
    icon: FileText,
  },
  {
    title: "Payments",
    href: "/payments",
    icon: CreditCard,
  },
];

export interface AdminSidebarProps {
  user: AuthUser;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function AdminSidebar({
  user,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}: AdminSidebarProps) {
  const pathname = usePathname();

  // Filter items if adminOnly and user is not admin
  const visibleItems = navItems.filter((item) => {
    if (item.adminOnly && user.role !== "admin") return false;
    return true;
  });

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between bg-white text-[#2B302B]">
      {/* Top Header / Logo */}
      <div>
        <div className="h-16 px-4 flex items-center justify-between border-b border-[#B9CBB9]">
          {!collapsed ? (
            <Logo size="default" href="/dashboard" />
          ) : (
            <div className="mx-auto">
              <Logo size="sm" showSubtitle={false} href="/dashboard" />
            </div>
          )}

          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="md:hidden p-1.5 text-[#8A968A] hover:text-[#2B302B] rounded-[2px]"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Label */}
        {!collapsed && (
          <div className="px-5 pt-5 pb-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#8A968A]">
              TELEMETRY MENU
            </span>
          </div>
        )}

        {/* Navigation List */}
        <nav className="px-2.5 py-2 space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                title={collapsed ? item.title : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-[3px] text-xs font-semibold tracking-wide transition-colors group relative select-none",
                  isActive
                    ? "bg-[#D3E3D3]/80 text-[#2B302B] font-bold"
                    : "text-[#2B302B] hover:bg-[#E4EEE4]/60",
                  collapsed && "justify-center px-2"
                )}
              >
                {/* Active Orange Marker */}
                {isActive && (
                  <span
                    className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-[2px] bg-[#F57B4A]"
                    aria-hidden="true"
                  />
                )}

                <Icon
                  className={cn(
                    "w-4 h-4 shrink-0 transition-colors",
                    isActive
                      ? "text-[#2B302B] stroke-[2.2]"
                      : "text-[#8A968A] stroke-[1.8] group-hover:text-[#2B302B]"
                  )}
                />

                {!collapsed && <span>{item.title}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom User Rail & Collapse Toggle */}
      <div className="p-3 border-t border-[#B9CBB9] space-y-2">
        {!collapsed && (
          <div className="px-2 py-1.5 bg-[#E4EEE4]/50 border border-[#B9CBB9] rounded-[2px] flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-[#2B302B] uppercase truncate max-w-[120px]">
                {user.name}
              </span>
              <span className="text-[9px] font-mono text-[#8A968A] uppercase">
                {user.role} console
              </span>
            </div>
            <span
              className={cn(
                "px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase rounded-[2px]",
                user.role === "admin"
                  ? "bg-[#2B302B] text-white"
                  : "bg-[#D3E3D3] text-[#2B302B] border border-[#B9CBB9]"
              )}
            >
              {user.role}
            </span>
          </div>
        )}

        {/* Desktop Collapse Toggle */}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden md:flex w-full items-center justify-center p-1.5 text-xs text-[#8A968A] hover:text-[#2B302B] hover:bg-[#E4EEE4]/60 rounded-[2px] border border-[#B9CBB9] transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase">
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Collapse Rail</span>
            </div>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={cn(
          "hidden md:block shrink-0 bg-white border-r-[1.5px] border-[#B9CBB9] transition-all duration-200 z-30",
          collapsed ? "w-16" : "w-60"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-[#2B302B]/40 backdrop-blur-[1px] md:hidden animate-in fade-in-0 duration-150"
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r-[1.5px] border-[#B9CBB9] shadow-xl md:hidden transform transition-transform duration-200 ease-in-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </div>
    </>
  );
}

