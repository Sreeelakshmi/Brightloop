"use client";

import * as React from "react";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/ui-shared/Logo";
import { handleLogin } from "@/app/actions/auth-actions";
import { SEED_CREDENTIALS } from "@/lib/mock/seed";
import { ShieldCheck, Users, UserCheck, ArrowRight, Lock, AlertCircle, Loader2, KeyRound } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect") || "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quick fill helper
  const fillCredentials = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
    setError(null);
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    if (redirectParam) formData.set("redirect", redirectParam);

    const res = await handleLogin(formData);
    if (res?.error) {
      setError(res.error);
      setSubmitting(false);
    }
  }

  // Quick 1-click bypass login for backward-compatibility with tests/demo
  const handleQuickLogin = async (role: "admin" | "staff" | "customer") => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (data.success) {
        router.push(redirectParam || data.redirect);
        router.refresh();
      }
    } catch (err: any) {
      setError("Fast login failed.");
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white border-[1.5px] border-[#B9CBB9] rounded-[3px] shadow-none overflow-hidden font-sans">
      {/* Top Banner */}
      <div className="bg-[#2B302B] text-white px-5 py-3 flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-widest font-mono">
          BRIGHTLOOP // SECURITY GATEWAY
        </span>
        <span className="w-2 h-2 rounded-[1px] bg-[#F57B4A] inline-block" />
      </div>

      <div className="p-6 sm:p-8 space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2 border-b border-[#B9CBB9]/60 pb-5">
          <Logo size="default" href="" />
          <h1 className="text-xl font-bold uppercase tracking-tight text-[#2B302B] mt-2">
            System Sign In
          </h1>
          <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#8A968A]">
            ENTER CREDENTIALS OR SELECT DEMO ACCOUNT
          </div>
        </div>

        {error && (
          <div className="p-3 bg-[#F57B4A]/10 border border-[#F57B4A] rounded-[2px] flex items-start gap-2 text-xs text-[#F57B4A] font-mono">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#2B302B] font-mono">
              Email Address
            </label>
            <input
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full h-9 px-3 text-xs bg-white border border-[#B9CBB9] rounded-[2px] text-[#2B302B] focus:border-[#2B302B] focus:outline-none font-sans"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#2B302B] font-mono">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-[10px] font-mono font-bold text-[#8A968A] hover:text-[#2B302B] transition-colors"
              >
                FORGOT PASSWORD?
              </Link>
            </div>
            <input
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full h-9 px-3 text-xs bg-white border border-[#B9CBB9] rounded-[2px] text-[#2B302B] focus:border-[#2B302B] focus:outline-none font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-9 bg-[#2B302B] text-white hover:bg-[#1f221f] text-xs font-bold uppercase tracking-widest rounded-[2px] transition-colors font-mono disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                VERIFYING...
              </>
            ) : (
              "SIGN IN TO SYSTEM"
            )}
          </button>
        </form>

        <div className="text-center">
          <Link
            href="/signup"
            className="text-xs font-mono font-bold text-[#2B302B] hover:text-[#F57B4A] transition-colors"
          >
            DON&apos;T HAVE AN ACCOUNT? REGISTER HERE →
          </Link>
        </div>

        {/* Demo Accounts Panel */}
        <div className="pt-5 border-t border-[#B9CBB9] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#8A968A] font-mono flex items-center gap-1.5">
              <KeyRound className="w-3 h-3 text-[#F57B4A]" />
              DEMO ACCOUNTS (ONE-CLICK FILL)
            </span>
            <span className="text-[9px] font-mono bg-[#D3E3D3] text-[#2B302B] px-1.5 py-0.5 rounded-[2px]">
              DEV MODE
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {/* Admin */}
            <div className="p-2.5 bg-[#E4EEE4]/50 border border-[#B9CBB9] rounded-[2px] flex items-center justify-between">
              <div className="space-y-0.5 text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-[#2B302B]">Admin ({SEED_CREDENTIALS.admin.name})</span>
                  <span className="text-[9px] font-mono px-1 bg-[#2B302B] text-white rounded-[1px]">ADMIN</span>
                </div>
                <div className="text-[10px] font-mono text-[#8A968A]">
                  {SEED_CREDENTIALS.admin.email} <span className="opacity-50">/</span> <span className="font-semibold text-[#2B302B]">{SEED_CREDENTIALS.admin.password}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => fillCredentials(SEED_CREDENTIALS.admin.email, SEED_CREDENTIALS.admin.password)}
                  className="px-2 py-1 bg-white hover:bg-[#D3E3D3] border border-[#B9CBB9] text-[9px] font-mono font-bold text-[#2B302B] rounded-[2px]"
                >
                  FILL
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin("admin")}
                  className="px-2 py-1 bg-[#2B302B] hover:bg-black text-[9px] font-mono font-bold text-white rounded-[2px]"
                >
                  GO
                </button>
              </div>
            </div>

            {/* Staff */}
            <div className="p-2.5 bg-[#E4EEE4]/50 border border-[#B9CBB9] rounded-[2px] flex items-center justify-between">
              <div className="space-y-0.5 text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-[#2B302B]">Staff ({SEED_CREDENTIALS.staff[0].name})</span>
                  <span className="text-[9px] font-mono px-1 bg-[#8A968A] text-white rounded-[1px]">STAFF</span>
                </div>
                <div className="text-[10px] font-mono text-[#8A968A]">
                  {SEED_CREDENTIALS.staff[0].email} <span className="opacity-50">/</span> <span className="font-semibold text-[#2B302B]">{SEED_CREDENTIALS.staff[0].password}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => fillCredentials(SEED_CREDENTIALS.staff[0].email, SEED_CREDENTIALS.staff[0].password)}
                  className="px-2 py-1 bg-white hover:bg-[#D3E3D3] border border-[#B9CBB9] text-[9px] font-mono font-bold text-[#2B302B] rounded-[2px]"
                >
                  FILL
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin("staff")}
                  className="px-2 py-1 bg-[#8A968A] hover:bg-[#727d72] text-[9px] font-mono font-bold text-white rounded-[2px]"
                >
                  GO
                </button>
              </div>
            </div>

            {/* Customer */}
            <div className="p-2.5 bg-[#E4EEE4]/50 border border-[#B9CBB9] rounded-[2px] flex items-center justify-between">
              <div className="space-y-0.5 text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-[#2B302B]">Customer ({SEED_CREDENTIALS.customers[0].name})</span>
                  <span className="text-[9px] font-mono px-1 bg-[#D3E3D3] text-[#2B302B] border border-[#B9CBB9] rounded-[1px]">PORTAL</span>
                </div>
                <div className="text-[10px] font-mono text-[#8A968A]">
                  {SEED_CREDENTIALS.customers[0].email} <span className="opacity-50">/</span> <span className="font-semibold text-[#2B302B]">{SEED_CREDENTIALS.customers[0].password}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => fillCredentials(SEED_CREDENTIALS.customers[0].email, SEED_CREDENTIALS.customers[0].password)}
                  className="px-2 py-1 bg-white hover:bg-[#D3E3D3] border border-[#B9CBB9] text-[9px] font-mono font-bold text-[#2B302B] rounded-[2px]"
                >
                  FILL
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin("customer")}
                  className="px-2 py-1 bg-[#D3E3D3] hover:bg-[#c2d6c2] text-[9px] font-mono font-bold text-[#2B302B] border border-[#B9CBB9] rounded-[2px]"
                >
                  GO
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#E4EEE4] flex flex-col items-center justify-center p-4">
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
