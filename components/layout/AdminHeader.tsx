"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AuthUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Bell,
  Search,
  Menu,
  LogOut,
  User,
  Shield,
  CheckCircle2,
} from "lucide-react";

export interface AdminHeaderProps {
  user: AuthUser;
  onOpenMobileMenu: () => void;
}

export function AdminHeader({ user, onOpenMobileMenu }: AdminHeaderProps) {
  const router = useRouter();
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
    <header className="h-16 px-4 sm:px-6 bg-[#E4EEE4] border-b-[1.5px] border-[#B9CBB9] flex items-center justify-between gap-4 sticky top-0 z-20">
      {/* Left Search Bar & Mobile Hamburger */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 text-[#2B302B] hover:bg-[#D3E3D3] rounded-[2px] border border-[#B9CBB9]"
          aria-label="Open navigation drawer"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Telemetry Search Field */}
        <div className="relative w-full max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8A968A]" />
          <input
            type="text"
            placeholder="Search subscriptions, invoices, customers..."
            className="w-full h-8 pl-8 pr-3 text-xs bg-white border-[1.5px] border-[#B9CBB9] rounded-[3px] text-[#2B302B] placeholder:text-[#8A968A] focus:outline-none focus:border-[#2B302B] focus:ring-1 focus:ring-[#F57B4A] transition-all"
          />
        </div>
      </div>

      {/* Right Controls: Role Tag, Notification Bell, Profile Menu */}
      <div className="flex items-center gap-3">
        {/* Role Tag */}
        <div className="hidden sm:inline-flex items-center">
          <span
            className={`px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider rounded-[2px] uppercase border ${
              user.role === "admin"
                ? "bg-[#2B302B] text-white border-[#2B302B]"
                : "bg-[#D3E3D3] text-[#2B302B] border-[#B9CBB9]"
            }`}
          >
            {user.role}
          </span>
        </div>

        {/* Notification Bell */}
        <button
          type="button"
          className="relative p-2 text-[#2B302B] hover:bg-[#D3E3D3]/60 rounded-[2px] transition-colors focus:outline-none focus:ring-2 focus:ring-[#F57B4A]"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#F57B4A] ring-2 ring-[#E4EEE4]" />
        </button>

        {/* Profile Avatar & Dropdown Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1 pl-1.5 bg-white border border-[#B9CBB9] rounded-[3px] hover:bg-[#D3E3D3]/40 transition-colors focus:outline-none focus:ring-2 focus:ring-[#F57B4A]"
            aria-expanded={profileOpen}
          >
            <div className="w-6 h-6 rounded-full bg-[#2B302B] text-white flex items-center justify-center text-[10px] font-bold">
              {user.name.charAt(0)}
            </div>
            <span className="hidden md:inline-block text-xs font-semibold text-[#2B302B] max-w-[100px] truncate">
              {user.name}
            </span>
          </button>

          {/* Profile Dropdown */}
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
      </div>
    </header>
  );
}

