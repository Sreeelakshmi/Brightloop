"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PasswordChecklist } from "@/components/auth/PasswordChecklist";
import { handleSignup } from "@/app/actions/auth-actions";
import { Logo } from "@/components/ui-shared/Logo";
import { AlertCircle } from "lucide-react";

export default function SignupPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const res = await handleSignup(formData);

    if (res?.error) {
      setError(res.error);
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#E4EEE4] flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md bg-white border-[1.5px] border-[#B9CBB9] rounded-[3px] shadow-none overflow-hidden">
        {/* Telemetry Header */}
        <div className="bg-[#2B302B] text-white px-5 py-3 flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-widest font-mono">
            ACCOUNT REGISTRATION // NEW CUSTOMER
          </span>
          <span className="w-2 h-2 rounded-[1px] bg-[#F57B4A] inline-block animate-pulse" />
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <Logo />
            <h1 className="text-xl font-bold uppercase tracking-tight text-[#2B302B] mt-2">
              Create Customer Portal Account
            </h1>
            <p className="text-xs text-[#8A968A] font-mono">
              Register for immediate access to subscriptions, invoices & telemetry.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-[#F57B4A]/10 border border-[#F57B4A] rounded-[2px] flex items-start gap-2 text-xs text-[#F57B4A] font-mono">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#2B302B] font-mono">
                Full Name
              </label>
              <input
                name="name"
                type="text"
                required
                placeholder="Rohan Sharma"
                className="w-full h-9 px-3 text-xs bg-white border border-[#B9CBB9] rounded-[2px] text-[#2B302B] focus:border-[#2B302B] focus:outline-none font-sans"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#2B302B] font-mono">
                Company / Organization
              </label>
              <input
                name="company"
                type="text"
                required
                placeholder="AeroGroup Technologies Pvt Ltd"
                className="w-full h-9 px-3 text-xs bg-white border border-[#B9CBB9] rounded-[2px] text-[#2B302B] focus:border-[#2B302B] focus:outline-none font-sans"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#2B302B] font-mono">
                Work Email (Login ID)
              </label>
              <input
                name="email"
                type="email"
                required
                placeholder="billing@aerogroup.com"
                className="w-full h-9 px-3 text-xs bg-white border border-[#B9CBB9] rounded-[2px] text-[#2B302B] focus:border-[#2B302B] focus:outline-none font-sans"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#2B302B] font-mono">
                Password
              </label>
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

            {/* Live Password Checklist */}
            <PasswordChecklist password={password} />

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#2B302B] font-mono">
                Confirm Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full h-9 px-3 text-xs bg-white border border-[#B9CBB9] rounded-[2px] text-[#2B302B] focus:border-[#2B302B] focus:outline-none font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-9 bg-[#2B302B] text-white hover:bg-[#1f221f] text-xs font-bold uppercase tracking-widest rounded-[2px] transition-colors font-mono disabled:opacity-50"
            >
              {submitting ? "CREATING ACCOUNT..." : "CREATE ACCOUNT & ENTER PORTAL"}
            </button>
          </form>

          <div className="pt-4 border-t border-[#B9CBB9]/60 flex items-center justify-between text-[11px] font-mono">
            <span className="text-[#8A968A]">Already have credentials?</span>
            <Link href="/login" className="font-bold text-[#2B302B] hover:text-[#F57B4A] transition-colors">
              LOG IN →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

