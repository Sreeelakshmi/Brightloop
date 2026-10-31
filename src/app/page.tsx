import Link from "next/link";
import {
  Repeat,
  ArrowRight,
  Shield,
  Layers,
  CreditCard,
  BarChart3,
  Users,
  Code2,
  GitBranch,
} from "lucide-react";

export default function HomePage() {
  const teamBranches = [
    {
      member: "Member 1",
      branch: "feature/admin-backend",
      role: "Core Infrastructure & Admin",
      scope: "Auth, Supabase, Products, Plans, Staff Management, Database & Seeds",
      icon: Users,
    },
    {
      member: "Member 2",
      branch: "feature/subscriptions",
      role: "Subscription Engine",
      scope: "Quotations, Subscriptions, Upgrades/Downgrades, Renewals, Lifecycle",
      icon: Repeat,
    },
    {
      member: "Member 3",
      branch: "feature/billing-payments",
      role: "Billing & Financials",
      scope: "Recurring Billing, Invoicing, Discounts, Taxes, Payment Processing",
      icon: CreditCard,
    },
    {
      member: "Member 4",
      branch: "feature/dashboard-ai",
      role: "Experience & AI Insights",
      scope: "Executive Dashboard, Customer Portal, Gemini AI Revenue Insights",
      icon: BarChart3,
    },
  ];

  return (
    <div className="min-h-screen bg-brightloop-bg flex flex-col font-sans">
      {/* Top Banner */}
      <header className="border-b border-border bg-white sticky top-0 z-20 shadow-subtle">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-brightloop-coral flex items-center justify-center text-white shadow-sm">
              <Repeat className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg uppercase tracking-wider text-brightloop-text">
                Brightloop
              </span>
              <span className="ml-2 text-xs font-semibold uppercase tracking-wider text-brightloop-sage hidden sm:inline">
                Subscription Control System
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-bold uppercase tracking-wider text-brightloop-sage hover:text-brightloop-text px-3 py-1.5 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider bg-brightloop-coral text-white px-4 py-2 rounded-md hover:bg-brightloop-coral-hover transition-colors shadow-sm"
            >
              Launch Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-12 sm:py-16 space-y-16">
        <div className="text-center max-w-3xl mx-auto space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-white text-brightloop-coral border border-border shadow-subtle">
            <Code2 className="w-3.5 h-3.5 text-brightloop-coral" />
            B2B SaaS Subscription Control System
          </div>
          <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight text-brightloop-text">
            Subscription Management, <br />
            <span className="text-brightloop-coral">
              Streamlined & Scalable
            </span>
          </h1>
          <p className="text-sm sm:text-base text-brightloop-text/80 leading-relaxed font-medium">
            Brightloop gives B2B SaaS and subscription businesses end-to-end control
            over product pricing, quotes, recurring billing, automated invoicing,
            and AI-driven revenue metrics.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-brightloop-coral text-white font-bold uppercase tracking-wider text-xs px-5 py-2.5 rounded-md hover:bg-brightloop-coral-hover transition-colors shadow-sm"
            >
              <Layers className="w-4 h-4" />
              Explore Admin Dashboard
            </Link>
            <Link
              href="/customer"
              className="inline-flex items-center gap-2 bg-white text-brightloop-text font-bold uppercase tracking-wider text-xs px-5 py-2.5 rounded-md hover:bg-brightloop-bg/50 border border-border transition-colors shadow-subtle"
            >
              <Shield className="w-4 h-4 text-brightloop-coral" />
              Customer Portal
            </Link>
          </div>
        </div>

        {/* Team Collaboration Architecture */}
        <div className="space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-brightloop-text">
              Team Architecture & Modules
            </h2>
            <p className="text-xs font-semibold uppercase tracking-wider text-brightloop-sage">
              Modular separation of concerns for frictionless parallel development
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {teamBranches.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="rounded-lg border border-border bg-white p-5 space-y-3 shadow-card hover:border-brightloop-coral/60 transition-all hover:shadow-hover"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-md bg-brightloop-bg flex items-center justify-center text-brightloop-coral">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brightloop-coral px-2 py-0.5 rounded bg-brightloop-coral-light border border-brightloop-coral/30">
                      {item.member}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm uppercase tracking-wide text-brightloop-text">
                      {item.role}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-brightloop-sage font-mono mt-1">
                      <GitBranch className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{item.branch}</span>
                    </div>
                  </div>

                  <p className="text-xs text-brightloop-sage leading-relaxed pt-2 border-t border-border">
                    {item.scope}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Route Directory */}
        <div className="rounded-lg border border-border bg-white p-6 sm:p-8 space-y-4 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold uppercase tracking-wider text-brightloop-text">
              Module Directory Preview
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-wider text-brightloop-sage">
              Direct Route Access
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
            {[
              { name: "Admin Console", path: "/admin" },
              { name: "Products", path: "/products" },
              { name: "Plans", path: "/plans" },
              { name: "Customers", path: "/customers" },
              { name: "Staff", path: "/staff" },
              { name: "Quotations", path: "/quotations" },
              { name: "Subscriptions", path: "/subscriptions" },
              { name: "Invoices", path: "/invoices" },
              { name: "Payments", path: "/payments" },
              { name: "Customer Portal", path: "/customer" },
              { name: "Login", path: "/login" },
              { name: "Sign Up", path: "/signup" },
            ].map((route) => (
              <Link
                key={route.path}
                href={route.path}
                className="text-xs font-bold uppercase tracking-wide px-3 py-2.5 rounded-md border border-border bg-brightloop-bg/30 hover:bg-brightloop-coral hover:text-white hover:border-brightloop-coral text-brightloop-text text-center transition-all shadow-subtle truncate"
              >
                {route.name}
              </Link>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center text-xs font-semibold uppercase tracking-wider text-brightloop-sage bg-white">
        <p>Brightloop Architecture Skeleton — Official Design System Applied</p>
      </footer>
    </div>
  );
}
