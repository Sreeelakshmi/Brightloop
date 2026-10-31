import React from "react";
import Link from "next/link";
import { Repeat, ArrowLeft, LogOut } from "lucide-react";
import { logoutAction } from "@/lib/auth/actions";

export default function CustomerPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-brightloop-bg flex flex-col font-sans">
      <header className="h-16 border-b border-border bg-white px-6 flex items-center justify-between sticky top-0 z-30 shadow-subtle">
        <div className="flex items-center gap-3">
          <Link
            href="/customer"
            className="w-9 h-9 rounded-lg bg-brightloop-coral flex items-center justify-center text-white shadow-sm hover:bg-brightloop-coral-hover transition-colors"
            title="Customer Home"
          >
            <Repeat className="w-5 h-5" />
          </Link>
          <div>
            <span className="font-extrabold text-sm uppercase tracking-wider text-brightloop-text">
              Brightloop
            </span>
            <span className="text-xs text-brightloop-sage ml-2 uppercase tracking-wider font-semibold">
              Customer Portal
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brightloop-sage hover:text-brightloop-text transition-colors border border-border px-3 py-1.5 rounded-md bg-white shadow-subtle"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Home
          </Link>

          <form action={logoutAction}>
            <button
              type="submit"
              title="Sign Out"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brightloop-sage hover:text-destructive border border-border px-3 py-1.5 rounded-md bg-white hover:border-destructive/30 hover:bg-destructive/5 transition-colors shadow-subtle"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </form>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-6 sm:p-8">
        {children}
      </main>
    </div>
  );
}
