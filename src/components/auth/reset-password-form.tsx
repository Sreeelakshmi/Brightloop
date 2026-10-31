"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { resetPasswordAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  CheckCircle2,
  KeyRound,
  Check,
} from "lucide-react";

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter your new password.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.set("password", password);
      formData.set("confirmPassword", confirmPassword);

      const res = await resetPasswordAction(null, formData);

      if (!res.success) {
        setError(res.error || "Failed to update password. Please try again.");
        setLoading(false);
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push("/login?reset=success");
        }, 1500);
      }
    } catch (err: any) {
      setError(
        err?.message || "An unexpected error occurred while resetting password."
      );
      setLoading(false);
    }
  };

  return (
    <Card className="w-full shadow-card border border-border bg-white rounded-lg">
      <CardHeader className="text-center space-y-1.5 pb-4">
        <div className="mx-auto w-10 h-10 rounded-md bg-brightloop-coral/15 flex items-center justify-center text-brightloop-coral mb-1 border border-brightloop-coral/30">
          <KeyRound className="w-5 h-5" />
        </div>
        <CardTitle className="text-xl font-extrabold uppercase tracking-wider text-brightloop-text">
          Set New Password
        </CardTitle>
        <CardDescription className="text-xs text-brightloop-sage">
          Enter your new password below to regain account access
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Success Alert Banner */}
        {success && (
          <div className="flex items-start gap-2.5 p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              Password updated successfully! Redirecting you to sign in...
            </span>
          </div>
        )}

        {/* Error Alert Banner */}
        {error && (
          <div className="flex items-start gap-2.5 p-3 rounded-md bg-red-50 border border-red-200 text-red-800 text-xs font-medium">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-brightloop-text">
                New Password
              </Label>
              <div className="relative">
                <Lock className="w-4 h-4 text-brightloop-sage absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  disabled={loading}
                  placeholder="At least 6 characters"
                  className="pl-9 pr-9 bg-white border-border text-brightloop-text placeholder:text-brightloop-sage focus-visible:ring-brightloop-coral focus-visible:border-brightloop-coral"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brightloop-sage hover:text-brightloop-text focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-xs font-bold uppercase tracking-wider text-brightloop-text">
                Confirm New Password
              </Label>
              <div className="relative">
                <Lock className="w-4 h-4 text-brightloop-sage absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  disabled={loading}
                  placeholder="Re-enter new password"
                  className="pl-9 bg-white border-border text-brightloop-text placeholder:text-brightloop-sage focus-visible:ring-brightloop-coral focus-visible:border-brightloop-coral"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              {password && confirmPassword && (
                <p
                  className={`text-[11px] font-semibold flex items-center gap-1 ${
                    password === confirmPassword
                      ? "text-emerald-700"
                      : "text-red-600"
                  }`}
                >
                  {password === confirmPassword ? (
                    <>
                      <Check className="w-3 h-3" /> Passwords match
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3 h-3" /> Passwords do not match
                    </>
                  )}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="coral"
              className="w-full flex items-center justify-center gap-2 font-bold uppercase tracking-wider text-xs h-10"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Updating password...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Update Password</span>
                </>
              )}
            </Button>
          </form>
        )}
      </CardContent>

      <CardFooter className="flex justify-center border-t border-border py-4 text-xs text-brightloop-sage">
        <Link href="/login" className="text-brightloop-coral hover:underline font-bold">
          Back to Sign In
        </Link>
      </CardFooter>
    </Card>
  );
}
