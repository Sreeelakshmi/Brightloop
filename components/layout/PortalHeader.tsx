"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui-shared/Logo";
import { AuthUser } from "@/lib/auth";
import {
  Menu,
  X,
  LogOut,
  User,
  CreditCard,
  FileText,
  Layers,
  LayoutDashboard,
  ShieldAlert,
} from "lucide-react";

export interface PortalHeaderProps {
  user: AuthUser;
}

const portalTabs = [
  { label: "Overview", href: "/portal", icon: LayoutDashboard },
  { label: "My Subscriptions", href: "/portal/subscriptions", icon: Layers },
  { label: "Invoices", href: "/portal/invoices", icon: FileText },
  { label: "Payments", href: "/portal/payments", icon: CreditCard },
  { label: "Account", href: "/portal/account", icon: User },
];

export function PortalHeader({ user }: PortalHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [loggingOut, setLoggingOut] = React.useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header className="bg-white border-b-[1.5px] border-[#B9CBB9] sticky top-0 z-30 shadow-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <Logo size="default" href="/portal" />
            <span className="hidden lg:inline-block h-5 w-[1.5px] bg-[#B9CBB9]" />
            <span className="hidden lg:inline-block text-[10px] font-mono font-bold uppercase tracking-widest text-[#8A968A]">
              CUSTOMER SELF-SERVICE
            </span>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1">
            {portalTabs.map((tab) => {
              const isActive =
                tab.href === "/portal"
                  ? pathname === "/portal"
                  : pathname === tab.href || pathname.startsWith(`${tab.href}/`);

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    "px-3 py-1.5 rounded-[3px] text-xs font-semibold tracking-wide transition-all relative select-none",
                    isActive
                      ? "bg-[#D3E3D3] text-[#2B302B] font-bold"
                      : "text-[#8A968A] hover:text-[#2B302B] hover:bg-[#E4EEE4]/60"
                  )}
                >
                  {tab.label}
                  {isActive && (
                    <span
                      className="absolute -bottom-2 left-3 right-3 h-[2px] bg-[#F57B4A] rounded-full"
                      aria-hidden="true"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Controls: User Profile & Mobile Toggle */}
          <div className="flex items-center gap-2">
            {/* Customer Tag */}
            <span className="hidden sm:inline-flex px-2 py-0.5 bg-[#E4EEE4] text-[#2B302B] border border-[#B9CBB9] rounded-[2px] text-[10px] font-mono font-bold uppercase">
              PORTAL ACCESS
            </span>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 p-1.5 pl-2 bg-[#E4EEE4]/50 border border-[#B9CBB9] rounded-[3px] hover:bg-[#D3E3D3]/60 transition-colors focus:outline-none focus:ring-2 focus:ring-[#F57B4A]"
              >
                <div className="w-6 h-6 rounded-full bg-[#2B302B] text-white flex items-center justify-center text-[10px] font-bold">
                  {user.name.charAt(0)}
                </div>
                <span className="text-xs font-semibold text-[#2B302B] max-w-[120px] truncate">
                  {user.name}
                </span>
              </button>

              {profileOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-white border-[1.5px] border-[#B9CBB9] rounded-[3px] p-2 shadow-lg z-50 animate-in fade-in-0 zoom-in-95"
                  onMouseLeave={() => setProfileOpen(false)}
                >
                  <div className="px-2.5 py-2 border-b border-[#B9CBB9] mb-1">
                    <div className="text-xs font-bold text-[#2B302B] uppercase">
                      {user.name}
                    </div>
                    <div className="text-[10px] text-[#8A968A] truncate font-mono">
                      {user.email}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-[#2B302B] hover:bg-[#E4EEE4] rounded-[2px] font-semibold text-left transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5 text-[#F57B4A]" />
                    <span>{loggingOut ? "Signing out..." : "Log out"}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-[#2B302B] hover:bg-[#D3E3D3]/60 rounded-[2px] border border-[#B9CBB9]"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#B9CBB9] py-3 space-y-1">
            {portalTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive =
                tab.href === "/portal"
                  ? pathname === "/portal"
                  : pathname === tab.href || pathname.startsWith(`${tab.href}/`);

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-[2px] text-xs font-semibold transition-colors",
                    isActive
                      ? "bg-[#D3E3D3] text-[#2B302B] font-bold"
                      : "text-[#8A968A] hover:bg-[#E4EEE4]"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
}

