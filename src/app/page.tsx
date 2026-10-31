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
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background flex flex-col">
      {/* Top Banner */}
      <header className="border-b bg-card/60 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
              <Repeat className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight">Brightloop</span>
              <span className="ml-2 text-xs text-muted-foreground hidden sm:inline">
                Subscription Management System
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground px-3 py-1.5 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
            <Code2 className="w-3.5 h-3.5" />
            8-Hour Hackathon Architecture Skeleton
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            Subscription Management, <br />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Streamlined & Scalable
            </span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Brightloop gives B2B SaaS and subscription businesses end-to-end control
            over product pricing, quotes, recurring billing, automated invoicing,
            and AI-driven revenue metrics.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-medium px-5 py-2.5 rounded-lg hover:bg-primary/90 transition-colors shadow"
            >
              <Layers className="w-4 h-4" />
              Explore Admin Dashboard
            </Link>
            <Link
              href="/portal"
              className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground font-medium px-5 py-2.5 rounded-lg hover:bg-secondary/80 border transition-colors"
            >
              <Shield className="w-4 h-4" />
              Customer Portal
            </Link>
          </div>
        </div>

        {/* Team Collaboration Architecture */}
        <div className="space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">Team Git & Module Allocation</h2>
            <p className="text-sm text-muted-foreground">
              Modular separation of concerns for frictionless parallel development
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {teamBranches.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="rounded-xl border bg-card p-5 space-y-3 shadow-sm hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-primary px-2 py-0.5 rounded bg-primary/10">
                      {item.member}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base">{item.role}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono mt-1">
                      <GitBranch className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{item.branch}</span>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed pt-1 border-t">
                    {item.scope}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Route Directory */}
        <div className="rounded-2xl border bg-card p-6 sm:p-8 space-y-4 shadow-sm">
          <h2 className="text-xl font-bold tracking-tight">Module Directory Preview</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
            {[
              { name: "Products", path: "/products" },
              { name: "Plans", path: "/plans" },
              { name: "Customers", path: "/customers" },
              { name: "Staff", path: "/staff" },
              { name: "Quotations", path: "/quotations" },
              { name: "Subscriptions", path: "/subscriptions" },
              { name: "Invoices", path: "/invoices" },
              { name: "Payments", path: "/payments" },
              { name: "Settings", path: "/settings" },
              { name: "Customer Portal", path: "/portal" },
              { name: "Login", path: "/login" },
              { name: "Register", path: "/register" },
            ].map((route) => (
              <Link
                key={route.path}
                href={route.path}
                className="text-xs font-medium px-3 py-2 rounded-lg border bg-muted/40 hover:bg-accent hover:text-foreground text-center transition-colors truncate"
              >
                {route.name}
              </Link>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-xs text-muted-foreground bg-card">
        <p>Brightloop Architecture Skeleton — Initialized for 8-Hour Hackathon Development</p>
      </footer>
    </div>
  );
}
