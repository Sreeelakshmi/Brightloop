"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginAction } from "@/lib/auth/actions";
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
  LogIn,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ShieldCheck,
} from "lucide-react";

interface LoginFormProps {
  redirectTo?: string;
  initialMessage?: string;
  initialError?: string;
}

export function LoginForm({
  redirectTo = "",
  initialMessage,
  initialError,
}: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError || null);
  const [message, setMessage] = useState<string | null>(initialMessage || null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.set("email", email.trim());
      formData.set("password", password);
      if (redirectTo) {
        formData.set("redirectTo", redirectTo);
      }

      const res = await loginAction(null, formData);

      if (!res.success) {
        setError(res.error || "Invalid login credentials. Please try again.");
        setLoading(false);
      } else if (res.redirectUrl) {
        router.push(res.redirectUrl);
        router.refresh();
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred during sign in.");
      setLoading(false);
    }
  };

  return (
    <Card className="w-full shadow-card border border-border bg-white rounded-lg">
      <CardHeader className="text-center space-y-1.5 pb-4">
        <div className="mx-auto w-10 h-10 rounded-md bg-brightloop-coral/15 flex items-center justify-center text-brightloop-coral mb-1 border border-brightloop-coral/30">
          <LogIn className="w-5 h-5" />
        </div>
        <CardTitle className="text-xl font-extrabold uppercase tracking-wider text-brightloop-text">
          Sign In
        </CardTitle>
        <CardDescription className="text-xs text-brightloop-sage">
          Enter your credentials to access your Brightloop account
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
          <input type="hidden" name="redirectTo" value={redirectTo} />

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
                placeholder="name@company.com"
                className="pl-9 bg-white border-border text-brightloop-text placeholder:text-brightloop-sage focus-visible:ring-brightloop-coral focus-visible:border-brightloop-coral"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-brightloop-text">
                Password
              </Label>
              <Link
                href="/forgot-password"
                className="text-xs text-brightloop-coral hover:underline font-semibold"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-brightloop-sage absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                disabled={loading}
                placeholder="••••••••"
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
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </>
            )}
          </Button>
        </form>

        {/* Security / RBAC badge */}
        <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] font-medium text-brightloop-sage">
          <ShieldCheck className="w-3.5 h-3.5 text-brightloop-coral" />
          <span>Role-aware authentication & SSR cookie sessions</span>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-2 pt-0 pb-6 border-t border-border text-center text-xs text-brightloop-sage">
        <div className="pt-3">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-brightloop-coral hover:underline font-bold"
          >
            Sign up
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
