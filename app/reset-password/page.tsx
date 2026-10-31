"use client";

import React, { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/ui-shared/Logo";
import { PasswordChecklist } from "@/components/auth/PasswordChecklist";
import { handleResetPassword } from "@/app/actions/auth-actions";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!token) {
    return (
      <div className="p-6 sm:p-8 space-y-4 text-center">
        <div className="p-3 bg-[#F57B4A]/10 border border-[#F57B4A] rounded-[2px] text-xs text-[#F57B4A] font-mono">
          NO RESET TOKEN PROVIDED
        </div>
        <p className="text-xs text-[#8A968A] leading-relaxed">
          Please check the link in your reset email or request a new password recovery link.
        </p>
        <Link
          href="/forgot-password"
          className="inline-block px-4 py-2 bg-[#2B302B] text-white rounded-[2px] text-xs font-mono font-bold"
        >
          REQUEST NEW RESET LINK
        </Link>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    formData.set("token", token);

    const res = await handleResetPassword(formData);
    setSubmitting(false);

    if (res?.error) {
      setError(res.error);
    } else if (res?.success) {
      setSuccess(true);
    }
  }

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div className="space-y-1">
        <Logo />
        <h1 className="text-xl font-bold uppercase tracking-tight text-[#2B302B] mt-2">
          Set New Password
        </h1>
        <p className="text-xs text-[#8A968A] font-mono">
          Enter a secure replacement password adhering to enterprise complexity rules.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-[#F57B4A]/10 border border-[#F57B4A] rounded-[2px] flex items-start gap-2 text-xs text-[#F57B4A] font-mono">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success ? (
        <div className="space-y-4">
          <div className="p-4 bg-[#D3E3D3]/50 border border-[#B9CBB9] rounded-[2px] space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#2B302B] font-mono">
              <CheckCircle2 className="w-4 h-4 text-[#2B302B]" />
              PASSWORD UPDATED SUCCESSFULLY
            </div>
            <p className="text-xs text-[#2B302B] leading-relaxed">
              Your password has been changed. Single-use token invalidated. You may now sign in with your new credentials.
            </p>
          </div>

          <Link
            href="/login"
            className="w-full h-9 bg-[#2B302B] text-white hover:bg-[#1f221f] text-xs font-bold uppercase tracking-widest rounded-[2px] transition-colors font-mono flex items-center justify-center"
          >
            PROCEED TO SIGN IN →
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#2B302B] font-mono">
              New Password
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

          <PasswordChecklist password={password} />

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#2B302B] font-mono">
              Confirm New Password
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
            className="w-full h-9 bg-[#2B302B] text-white hover:bg-[#1f221f] text-xs font-bold uppercase tracking-widest rounded-[2px] transition-colors font-mono disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                UPDATING PASSWORD...
              </>
            ) : (
              "SAVE NEW PASSWORD"
            )}
          </button>
        </form>
      )}

      <div className="pt-4 border-t border-[#B9CBB9]/60 text-center text-[11px] font-mono">
        <Link href="/login" className="text-[#8A968A] hover:text-[#2B302B]">
          ← RETURN TO SIGN IN
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#E4EEE4] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border-[1.5px] border-[#B9CBB9] rounded-[3px] shadow-none overflow-hidden font-sans">
        <div className="bg-[#2B302B] text-white px-5 py-3 flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-widest font-mono">
            SECURITY KEY OVERWRITE // TOKEN VERIFICATION
          </span>
          <span className="w-2 h-2 rounded-[1px] bg-[#F57B4A] inline-block" />
        </div>
        <Suspense fallback={<div className="p-8 text-center text-xs font-mono text-[#8A968A]">LOADING TOKEN...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
