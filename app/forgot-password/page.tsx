"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui-shared/Logo";
import { handleForgotPassword } from "@/app/actions/auth-actions";
import { Mail, CheckCircle2, ArrowRight, AlertCircle, Loader2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [devMailboxUrl, setDevMailboxUrl] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const res = await handleForgotPassword(formData);

    setSubmitting(false);
    if (res?.error) {
      setError(res.error);
    } else if (res?.success) {
      setSubmitted(true);
      setMessage(res.message);
      if (res.devMailboxUrl) {
        setDevMailboxUrl(res.devMailboxUrl);
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#E4EEE4] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border-[1.5px] border-[#B9CBB9] rounded-[3px] shadow-none overflow-hidden font-sans">
        {/* Header */}
        <div className="bg-[#2B302B] text-white px-5 py-3 flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-widest font-mono">
            RECOVERY GATEWAY // PASSWORD RESET
          </span>
          <span className="w-2 h-2 rounded-[1px] bg-[#F57B4A] inline-block" />
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <Logo />
            <h1 className="text-xl font-bold uppercase tracking-tight text-[#2B302B] mt-2">
              Forgot Your Password?
            </h1>
            <p className="text-xs text-[#8A968A] font-mono">
              Enter your registered work email to generate an expiring single-use reset link.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-[#F57B4A]/10 border border-[#F57B4A] rounded-[2px] flex items-start gap-2 text-xs text-[#F57B4A] font-mono">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {submitted ? (
            <div className="space-y-4">
              <div className="p-4 bg-[#D3E3D3]/50 border border-[#B9CBB9] rounded-[2px] space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#2B302B] font-mono">
                  <CheckCircle2 className="w-4 h-4 text-[#2B302B]" />
                  RECOVERY DISPATCHED
                </div>
                <p className="text-xs text-[#2B302B] leading-relaxed">
                  {message}
                </p>
              </div>

              {devMailboxUrl && (
                <div className="p-3 bg-[#E4EEE4] border border-[#B9CBB9] rounded-[2px] space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#8A968A] font-mono">
                    DEVELOPMENT ENVIRONMENT DETECTED
                  </div>
                  <p className="text-xs text-[#2B302B]">
                    View the generated reset email and link directly in the simulated developer mailbox:
                  </p>
                  <Link
                    href={devMailboxUrl}
                    className="inline-flex items-center gap-1.5 h-8 px-3 bg-[#2B302B] text-white hover:bg-black rounded-[2px] text-xs font-mono font-bold uppercase tracking-wider"
                  >
                    <span>OPEN DEV MAILBOX</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}

              <div className="pt-2">
                <Link
                  href="/login"
                  className="w-full h-8 flex items-center justify-center border border-[#B9CBB9] bg-white hover:bg-[#D3E3D3]/60 text-xs font-mono font-bold text-[#2B302B] rounded-[2px]"
                >
                  RETURN TO SIGN IN
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#2B302B] font-mono">
                  Registered Email Address
                </label>
                <div className="relative">
                  <input
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="billing@aerogroup.com"
                    className="w-full h-9 pl-9 pr-3 text-xs bg-white border border-[#B9CBB9] rounded-[2px] text-[#2B302B] focus:border-[#2B302B] focus:outline-none font-sans"
                  />
                  <Mail className="w-4 h-4 text-[#8A968A] absolute left-3 top-2.5" />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-9 bg-[#2B302B] text-white hover:bg-[#1f221f] text-xs font-bold uppercase tracking-widest rounded-[2px] transition-colors font-mono disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    DISPATCHING...
                  </>
                ) : (
                  "GENERATE PASSWORD RESET LINK"
                )}
              </button>
            </form>
          )}

          <div className="pt-4 border-t border-[#B9CBB9]/60 flex items-center justify-between text-[11px] font-mono">
            <Link href="/login" className="text-[#8A968A] hover:text-[#2B302B] transition-colors">
              ← BACK TO SIGN IN
            </Link>
            <Link href="/signup" className="font-bold text-[#2B302B] hover:text-[#F57B4A] transition-colors">
              REGISTER NEW ACCOUNT →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

