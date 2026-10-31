import React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import { requireRole } from "@/lib/auth/session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side RBAC guard: Admin and Staff only
  // Unauthenticated users are redirected to /login; customers are redirected to /customer
  const { user, profile } = await requireRole(["admin", "staff"]);

  return (
    <div className="flex min-h-screen bg-brightloop-bg">
      {/* Reusable Sidebar Navigation */}
      <Sidebar role={profile.role} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar role={profile.role} userName={profile.fullName || profile.email} />
        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
