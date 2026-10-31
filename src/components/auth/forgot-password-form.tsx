"use client";

import React, { useState } from "react";
import Link from "next/link";
import { forgotPasswordAction } from "@/lib/auth/actions";
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
  KeyRound,
  Mail,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowLeft,
} from "lucide-react";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.set("email", email.trim());

      const res = await forgotPasswordAction(null, formData);

      if (!res.success) {
        setError(res.error || "Failed to send reset email. Please try again.");
      } else {
        setMessage(
          res.message ||
            "Password reset instructions have been sent to your email address. Please check your inbox."
        );
      }
    } catch (err: any) {
      setError(
        err?.message || "An unexpected error occurred. Please try again."
      );
    } finally {
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
          Reset Password
        </CardTitle>
        <CardDescription className="text-xs text-brightloop-sage">
          Enter your registered email address to receive password recovery instructions
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Success Alert Banner */}
        {message && (
          <div className="flex items-start gap-2.5 p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{message}</span>
          </div>
        )}

        {/* Error Alert Banner */}
        {error && (
          <div className="flex items-start gap-2.5 p-3 rounded-md bg-red-50 border border-red-200 text-red-800 text-xs font-medium">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-brightloop-text">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="w-4 h-4 text-brightloop-sage absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                disabled={loading}
                placeholder="name@company.com"
                className="pl-9 bg-white border-border text-brightloop-text placeholder:text-brightloop-sage focus-visible:ring-brightloop-coral focus-visible:border-brightloop-coral"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="coral"
            className="w-full flex items-center justify-center gap-2 font-bold uppercase tracking-wider text-xs h-10"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Sending reset email...</span>
              </>
            ) : (
              <>
                <Mail className="w-4 h-4" />
                <span>Send Reset Link</span>
              </>
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col gap-2 pt-0 pb-6 border-t border-border text-center text-xs text-brightloop-sage">
        <div className="pt-3">
          <Link
            href="/login"
            className="text-brightloop-coral hover:underline font-bold inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Sign In
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
