"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Logo } from "@/components/ui-shared/Logo";
import { UserRole } from "@/lib/auth";
import { ShieldCheck, UserCheck, Users, ArrowRight, Lock, Loader2 } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");
  const [loadingRole, setLoadingRole] = React.useState<UserRole | null>(null);

  const handleLogin = async (role: UserRole) => {
    setLoadingRole(role);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });

      const data = await res.json();
      if (data.success) {
        const target = redirectParam || data.redirect;
        router.push(target);
        router.refresh();
      }
    } catch (err) {
      console.error("Login failed:", err);
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <div className="w-full max-w-md bg-white border-[1.5px] border-[#B9CBB9] rounded-[3px] p-6 sm:p-8 space-y-6 shadow-none">
      {/* Brand Header */}
      <div className="flex flex-col items-center text-center space-y-2 border-b border-[#B9CBB9] pb-5">
        <Logo size="default" href="" />
        <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#8A968A] pt-1">
          TELEMETRY ACCESS GATEWAY // AUTH_V2
        </div>
      </div>

      {/* Notice */}
      <div className="p-3 bg-[#E4EEE4] border border-[#B9CBB9] rounded-[2px] text-xs text-[#2B302B] space-y-1">
        <div className="flex items-center gap-1.5 font-bold uppercase text-[10px] text-[#2B302B] font-mono">
          <Lock className="w-3 h-3 text-[#F57B4A]" />
          Session Authentication
        </div>
        <p className="text-[11px] text-[#8A968A] leading-relaxed">
          Select an authorized persona below to verify server-side route guards, layouts, and role access boundaries.
        </p>
      </div>

      {/* Role Selection Buttons */}
      <div className="space-y-3">
        {/* Admin Role */}
        <button
          type="button"
          disabled={loadingRole !== null}
          onClick={() => handleLogin("admin")}
          className="w-full p-3.5 bg-white border-[1.5px] border-[#B9CBB9] hover:border-[#2B302B] hover:bg-[#E4EEE4]/40 rounded-[3px] flex items-center justify-between text-left transition-all group focus:outline-none focus:ring-2 focus:ring-[#F57B4A]"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[2px] bg-[#2B302B] text-white flex items-center justify-center shrink-0">
              {loadingRole === "admin" ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#F57B4A]" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#2B302B] uppercase">
                  Alex V. (Administrator)
                </span>
                <span className="px-1.5 py-0.2 bg-[#2B302B] text-white text-[9px] font-mono font-bold rounded-[2px]">
                  ADMIN
                </span>
              </div>
              <span className="text-[11px] text-[#8A968A]">
                Full access to Dashboard, Reports & Telemetry Controls
              </span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-[#8A968A] group-hover:text-[#2B302B] transition-colors" />
        </button>

        {/* Staff Role */}
        <button
          type="button"
          disabled={loadingRole !== null}
          onClick={() => handleLogin("staff")}
          className="w-full p-3.5 bg-white border-[1.5px] border-[#B9CBB9] hover:border-[#2B302B] hover:bg-[#E4EEE4]/40 rounded-[3px] flex items-center justify-between text-left transition-all group focus:outline-none focus:ring-2 focus:ring-[#F57B4A]"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[2px] bg-[#8A968A] text-white flex items-center justify-center shrink-0">
              {loadingRole === "staff" ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#F57B4A]" />
              ) : (
                <Users className="w-4 h-4" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#2B302B] uppercase">
                  Elena R. (Operations Staff)
                </span>
                <span className="px-1.5 py-0.2 bg-[#D3E3D3] text-[#2B302B] text-[9px] font-mono font-bold rounded-[2px] border border-[#B9CBB9]">
                  STAFF
                </span>
              </div>
              <span className="text-[11px] text-[#8A968A]">
                Standard operational access to dashboard and reporting
              </span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-[#8A968A] group-hover:text-[#2B302B] transition-colors" />
        </button>

        {/* Customer Role */}
        <button
          type="button"
          disabled={loadingRole !== null}
          onClick={() => handleLogin("customer")}
          className="w-full p-3.5 bg-white border-[1.5px] border-[#B9CBB9] hover:border-[#2B302B] hover:bg-[#E4EEE4]/40 rounded-[3px] flex items-center justify-between text-left transition-all group focus:outline-none focus:ring-2 focus:ring-[#F57B4A]"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[2px] bg-[#D3E3D3] text-[#2B302B] flex items-center justify-center shrink-0 border border-[#B9CBB9]">
              {loadingRole === "customer" ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#F57B4A]" />
              ) : (
                <UserCheck className="w-4 h-4" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#2B302B] uppercase">
                  AeroGroup Billing (Customer)
                </span>
                <span className="px-1.5 py-0.2 bg-[#E4EEE4] text-[#2B302B] text-[9px] font-mono font-bold rounded-[2px] border border-[#B9CBB9]">
                  PORTAL
                </span>
              </div>
              <span className="text-[11px] text-[#8A968A]">
                Customer self-service portal, invoices & payment history
              </span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-[#8A968A] group-hover:text-[#2B302B] transition-colors" />
        </button>
      </div>

      {/* Footer info */}
      <div className="pt-2 border-t border-[#B9CBB9] text-center text-[10px] font-mono text-[#8A968A]">
        BRIGHTLOOP // ROUTE GUARD VALIDATION GATEWAY
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <Suspense
        fallback={
          <div className="p-8 bg-white border-[1.5px] border-[#B9CBB9] rounded-[3px] text-xs font-mono text-[#8A968A]">
            LOADING TELEMETRY GATEWAY...
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
