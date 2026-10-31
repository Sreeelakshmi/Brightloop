"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Bell, LogOut } from "lucide-react";
import { logoutAction } from "@/lib/auth/actions";

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="h-16 border-b border-[#D5DDD2]/70 bg-transparent px-6 sm:px-8 flex items-center justify-between sticky top-0 z-30">
      {/* Left side: subtle indicator or breadcrumbs */}
      <div className="flex items-center gap-2">
        {/* Decorative thin guide dot */}
        <div className="w-1.5 h-1.5 rounded-full bg-[#8C9B8E]/50" />
      </div>

      {/* Right side: Search pill, ADMIN role pill, Bell, User Avatar */}
      <div className="flex items-center gap-3">
        {/* Search Input Pill */}
        <div className="relative hidden sm:block w-52 md:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8C9B8E] pointer-events-none" />
          <input
            type="text"
            placeholder="Search"
            className="w-full h-8 pl-8 pr-3 rounded-full border border-[#D5DDD2] bg-white text-xs text-[#1F2622] placeholder:text-[#8C9B8E] focus:outline-none focus:border-[#8C9B8E] focus:ring-1 focus:ring-[#8C9B8E] shadow-sm transition-all"
          />
        </div>

        {/* Role Pill Badge ("ADMIN") */}
        <span className="px-2.5 py-1 rounded-md bg-[#DDE5DB] text-[#1F2622] text-[10px] font-bold tracking-wider uppercase font-mono select-none">
          ADMIN
        </span>

        {/* Notification Bell */}
        <button
          type="button"
          aria-label="Notifications"
          className="w-8 h-8 flex items-center justify-center rounded-full text-[#8C9B8E] hover:text-[#1F2622] hover:bg-white/80 transition-colors"
        >
          <Bell className="w-4 h-4" />
        </button>

        {/* User Avatar */}
        <div className="w-8 h-8 rounded-full bg-[#1F2622] text-white text-xs font-bold flex items-center justify-center border border-white shadow-sm overflow-hidden select-none">
          <span>BL</span>
        </div>

        {/* Logout Button */}
        <form action={logoutAction}>
          <button
            type="submit"
            title="Sign Out"
            className="w-8 h-8 flex items-center justify-center rounded-full text-[#8C9B8E] hover:text-[#F27B4B] hover:bg-white/80 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </header>
  );
}
