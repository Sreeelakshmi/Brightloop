"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Bell, GitBranch, Home } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();

  // Format module name from pathname e.g. "/subscriptions" -> "Subscriptions"
  const currentSection = pathname === "/" 
    ? "Home" 
    : pathname.split("/")[1] 
      ? pathname.split("/")[1].charAt(0).toUpperCase() + pathname.split("/")[1].slice(1)
      : "Dashboard";

  return (
    <header className="h-16 border-b bg-card/80 backdrop-blur-sm px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Go to Homepage"
          >
            <Home className="w-4 h-4" />
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="font-semibold text-foreground">{currentSection}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Placeholder search input */}
        <div className="relative hidden sm:block w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            readOnly
            placeholder="Search modules, plans, staff..."
            className="w-full h-9 pl-9 pr-4 rounded-md border bg-muted/30 text-xs placeholder:text-muted-foreground focus:outline-none cursor-not-allowed"
          />
        </div>

        {/* Hackathon Branch Indicator */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted text-xs text-muted-foreground font-mono">
          <GitBranch className="w-3.5 h-3.5 text-primary" />
          <span>brightloop-dev</span>
        </div>

        {/* Notification Icon Placeholder */}
        <button
          type="button"
          disabled
          aria-label="Notifications"
          className="w-9 h-9 flex items-center justify-center rounded-md border text-muted-foreground opacity-60 cursor-not-allowed"
        >
          <Bell className="w-4 h-4" />
        </button>

        {/* User Profile Avatar Placeholder */}
        <div className="flex items-center gap-2 pl-2 border-l">
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-xs flex items-center justify-center border border-primary/20">
            BL
          </div>
          <div className="hidden lg:block text-left text-xs">
            <p className="font-medium leading-none text-foreground">Hackathon Team</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Admin Role</p>
          </div>
        </div>
      </div>
    </header>
  );
}
