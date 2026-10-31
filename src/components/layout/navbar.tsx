"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Bell, GitBranch, Home, LogOut } from "lucide-react";
import { logoutAction } from "@/lib/auth/actions";

export function Navbar() {
  const pathname = usePathname();

  // Format module name from pathname e.g. "/subscriptions" -> "SUBSCRIPTIONS"
  const currentSection =
    pathname === "/"
      ? "HOME"
      : pathname.split("/")[1]
      ? pathname.split("/")[1].toUpperCase()
      : "DASHBOARD";

  return (
    <header className="h-16 border-b border-border bg-white/95 backdrop-blur-sm px-6 flex items-center justify-between sticky top-0 z-30 shadow-subtle">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs">
          <Link
            href="/"
            className="text-brightloop-sage hover:text-brightloop-text transition-colors"
            title="Go to Homepage"
          >
            <Home className="w-4 h-4" />
          </Link>
          <span className="text-brightloop-sage">/</span>
          <span className="font-extrabold uppercase tracking-wider text-brightloop-text">
            {currentSection}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Search input styled with Brightloop palette */}
        <div className="relative hidden sm:block w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brightloop-sage pointer-events-none" />
          <input
            type="text"
            readOnly
            placeholder="Search modules, plans, staff..."
            className="w-full h-9 pl-9 pr-4 rounded-md border border-border bg-brightloop-bg/30 text-xs text-brightloop-text placeholder:text-brightloop-sage focus:outline-none focus:border-brightloop-coral focus:ring-1 focus:ring-brightloop-coral cursor-not-allowed"
          />
        </div>

        {/* Hackathon Branch Indicator */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-brightloop-bg border border-border text-xs text-brightloop-text font-mono font-medium">
          <GitBranch className="w-3.5 h-3.5 text-brightloop-coral" />
          <span>brightloop-dev</span>
        </div>

        {/* Notification Icon */}
        <button
          type="button"
          disabled
          aria-label="Notifications"
          className="w-9 h-9 flex items-center justify-center rounded-md border border-border bg-white text-brightloop-sage opacity-70 cursor-not-allowed hover:bg-brightloop-bg/40 transition-colors"
        >
          <Bell className="w-4 h-4" />
        </button>

        {/* User Profile Avatar with Coral accent */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-border">
          <div className="w-8 h-8 rounded-md bg-brightloop-coral/15 text-brightloop-coral font-bold text-xs flex items-center justify-center border border-brightloop-coral/30">
            BL
          </div>
          <div className="hidden lg:block text-left text-xs">
            <p className="font-bold uppercase tracking-wider text-brightloop-text leading-none">
              Workspace
            </p>
            <p className="text-[10px] text-brightloop-sage font-medium mt-0.5">
              Admin & Staff
            </p>
          </div>
        </div>

        {/* Logout Form Button */}
        <form action={logoutAction}>
          <button
            type="submit"
            title="Sign Out"
            className="w-9 h-9 flex items-center justify-center rounded-md border border-border bg-white text-brightloop-sage hover:text-destructive hover:border-destructive/40 hover:bg-destructive/5 transition-colors shadow-subtle"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </form>
      </div>
    </header>
  );
}
