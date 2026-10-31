import React from "react";
import Link from "next/link";
import { Repeat, ArrowLeft } from "lucide-react";

export default function CustomerPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-muted/20 flex flex-col">
      <header className="h-16 border-b bg-card px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
            <Repeat className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight">Brightloop</span>
            <span className="text-xs text-muted-foreground ml-2">Customer Billing Portal</span>
          </div>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors border px-3 py-1.5 rounded-md bg-card"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Switch to Admin Dashboard
        </Link>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-6 sm:p-8">
        {children}
      </main>
    </div>
  );
}
