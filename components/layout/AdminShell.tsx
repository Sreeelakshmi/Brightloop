"use client";

import * as React from "react";
import { AuthUser } from "@/lib/auth";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";

export interface AdminShellProps {
  user: AuthUser;
  children: React.ReactNode;
}

export function AdminShell({ user, children }: AdminShellProps) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="min-h-screen flex bg-[#E4EEE4]">
      {/* Sidebar Navigation */}
      <AdminSidebar
        user={user}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminHeader
          user={user}
          onOpenMobileMenu={() => setMobileOpen(true)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

