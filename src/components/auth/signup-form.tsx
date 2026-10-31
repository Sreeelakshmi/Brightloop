"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signupAction } from "@/lib/auth/actions";
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
  UserPlus,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Check,
} from "lucide-react";

export function SignupForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    requiresVerification?: boolean;
    message?: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // Client-side validations
    if (!email.trim()) {
      setError("Email address is required.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter your password.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.set("fullName", fullName.trim());
      formData.set("email", email.trim());
      formData.set("password", password);
      formData.set("confirmPassword", confirmPassword);

      const res = await signupAction(null, formData);

      if (!res.success) {
        setError(res.error || "Failed to create account. Please try again.");
        setLoading(false);
      } else if (res.requiresVerification) {
        setSuccessInfo({
          requiresVerification: true,
          message:
            res.message ||
            "Account registered successfully! A confirmation link has been sent to your email address.",
        });
        setLoading(false);
      } else if (res.redirectUrl) {
        router.push(res.redirectUrl);
        router.refresh();
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred during signup.");
      setLoading(false);
    }
  };

  // If email verification state is active
  if (successInfo?.requiresVerification) {
    return (
      <Card className="w-full shadow-card border border-border bg-white rounded-lg">
        <CardHeader className="text-center space-y-1.5 pb-4">
          <div className="mx-auto w-12 h-12 rounded-md bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-1">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <CardTitle className="text-xl font-extrabold uppercase tracking-wider text-brightloop-text">
            Check Your Email
          </CardTitle>
          <CardDescription className="text-xs text-brightloop-sage">
            We&apos;ve sent a verification link to <strong className="text-brightloop-text">{email}</strong>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 text-center">
          <div className="p-4 rounded-md bg-brightloop-bg/40 border border-border text-xs text-brightloop-text text-left space-y-2">
            <p className="font-bold uppercase tracking-wider text-[11px] text-brightloop-sage">
              Next Steps:
            </p>
            <ol className="list-decimal list-inside space-y-1 font-medium text-brightloop-text/90">
              <li>Open your email inbox and locate the confirmation email.</li>
              <li>Click the confirmation link to activate your account.</li>
              <li>Sign in with your email and password to access the portal.</li>
            </ol>
          </div>

          <Button
            asChild
            variant="coral"
            className="w-full flex items-center justify-center gap-2 font-bold uppercase tracking-wider text-xs h-10"
          >
            <Link href="/login">Proceed to Sign In</Link>
          </Button>
        </CardContent>

        <CardFooter className="flex justify-center border-t border-border py-4 text-xs text-brightloop-sage">
          Didn&apos;t receive the email? Check your spam folder or try again.
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-card border border-border bg-white rounded-lg">
      <CardHeader className="text-center space-y-1.5 pb-4">
        <div className="mx-auto w-10 h-10 rounded-md bg-brightloop-coral/15 flex items-center justify-center text-brightloop-coral mb-1 border border-brightloop-coral/30">
          <UserPlus className="w-5 h-5" />
        </div>
        <CardTitle className="text-xl font-extrabold uppercase tracking-wider text-brightloop-text">
          Create Account
        </CardTitle>
        <CardDescription className="text-xs text-brightloop-sage">
          Sign up for a Brightloop customer account to manage subscriptions
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Error Alert Banner */}
        {error && (
          <div className="flex items-start gap-2.5 p-3 rounded-md bg-red-50 border border-red-200 text-red-800 text-xs font-medium">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Full Name Field */}
          <div className="space-y-1.5">
            <Label htmlFor="fullName" className="text-xs font-bold uppercase tracking-wider text-brightloop-text">
              Full Name
            </Label>
            <div className="relative">
              <User className="w-4 h-4 text-brightloop-sage absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                disabled={loading}
                placeholder="Jane Doe"
                className="pl-9 bg-white border-border text-brightloop-text placeholder:text-brightloop-sage focus-visible:ring-brightloop-coral focus-visible:border-brightloop-coral"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
          </div>

          {/* Email Field */}
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
                placeholder="jane@example.com"
                className="pl-9 bg-white border-border text-brightloop-text placeholder:text-brightloop-sage focus-visible:ring-brightloop-coral focus-visible:border-brightloop-coral"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-brightloop-text">
              Password
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

          {/* Confirm Password Field */}
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword" className="text-xs font-bold uppercase tracking-wider text-brightloop-text">
              Confirm Password
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
                placeholder="Re-enter password"
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

          {/* Customer Role Notice */}
          <div className="p-3 rounded-md bg-brightloop-bg/40 border border-border flex items-center gap-2 text-xs text-brightloop-text">
            <ShieldCheck className="w-4 h-4 text-brightloop-coral shrink-0" />
            <span>
              All public registrations are assigned the <strong className="text-brightloop-text">customer</strong> role. Staff/Admin roles require authorization.
            </span>
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
                <span>Creating account...</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Create Account</span>
              </>
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col gap-2 pt-0 pb-6 border-t border-border text-center text-xs text-brightloop-sage">
        <div className="pt-3">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-brightloop-coral hover:underline font-bold"
          >
            Sign in
          </Link>
        </div>
        <div>
          <Link
            href="/"
            className="text-brightloop-sage hover:text-brightloop-text transition-colors font-medium"
          >
            &larr; Back to Home
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
