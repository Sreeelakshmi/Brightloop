"use server";

import { createServerClient } from "@/lib/supabase/server";
import { getRoleRedirectPath } from "@/lib/auth/session";
import { UserRole } from "@/types";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export interface AuthActionResult {
  success: boolean;
  error?: string;
  message?: string;
  redirectUrl?: string;
  requiresVerification?: boolean;
}

/**
 * Server action to log in with email and password.
 * Resolves role strictly from `public.profiles` in PostgreSQL.
 */
export async function loginAction(
  prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;
  const redirectTo = (formData.get("redirectTo") as string)?.trim();

  if (!email || !password) {
    return { success: false, error: "Please provide both email and password." };
  }

  let supabase;
  try {
    supabase = createServerClient();
  } catch (err: any) {
    return {
      success: false,
      error:
        err?.message ||
        "Supabase connection is not configured. Please check environment variables.",
    };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  if (!data.user) {
    return { success: false, error: "Failed to authenticate user credentials." };
  }

  // Fetch trusted user role strictly from public.profiles table
  let role: UserRole = "customer";
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (
      profile?.role &&
      (profile.role === "admin" ||
        profile.role === "staff" ||
        profile.role === "customer")
    ) {
      role = profile.role as UserRole;
    }
  } catch {
    role = "customer";
  }

  // Determine post-login redirect path based on verified database role
  let finalDestination = getRoleRedirectPath(role);

  // If a safe redirectTo was provided (and not an auth page)
  if (
    redirectTo &&
    redirectTo.startsWith("/") &&
    !redirectTo.startsWith("/login") &&
    !redirectTo.startsWith("/signup") &&
    !redirectTo.startsWith("/register")
  ) {
    // If customer tries to redirect to admin/staff, route to /customer instead
    if (
      role === "customer" &&
      (redirectTo.startsWith("/admin") ||
        redirectTo.startsWith("/staff") ||
        redirectTo.startsWith("/dashboard") ||
        redirectTo.startsWith("/products") ||
        redirectTo.startsWith("/plans") ||
        redirectTo.startsWith("/customers") ||
        redirectTo.startsWith("/quotations") ||
        redirectTo.startsWith("/subscriptions") ||
        redirectTo.startsWith("/invoices") ||
        redirectTo.startsWith("/payments") ||
        redirectTo.startsWith("/settings"))
    ) {
      finalDestination = "/customer";
    } else {
      finalDestination = redirectTo;
    }
  }

  return {
    success: true,
    redirectUrl: finalDestination,
  };
}

/**
 * Server action to register a new user (always customer role).
 */
export async function signupAction(
  prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const fullName = (formData.get("fullName") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!email || !password) {
    return { success: false, error: "Email and password are required." };
  }

  if (password.length < 6) {
    return {
      success: false,
      error: "Password must be at least 6 characters long.",
    };
  }

  if (password !== confirmPassword) {
    return { success: false, error: "Passwords do not match." };
  }

  let supabase;
  try {
    supabase = createServerClient();
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Supabase connection is not configured.",
    };
  }

  // Resolve origin for confirmation callback redirect
  let origin = "http://localhost:3000";
  try {
    const headerList = headers();
    const host = headerList.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    origin = `${protocol}://${host}`;
  } catch {
    // default origin
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/customer`,
      data: {
        full_name: fullName || "",
        role: "customer", // Strict default role for public registration
      },
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  // If session is already created (Supabase email confirmation disabled in project)
  if (data.session) {
    return {
      success: true,
      redirectUrl: "/customer",
    };
  }

  // If email verification is enabled on Supabase
  return {
    success: true,
    requiresVerification: true,
    message:
      "Registration successful! Please check your email to confirm your account before logging in.",
  };
}

/**
 * Server action to log out the current user.
 */
export async function logoutAction() {
  try {
    const supabase = createServerClient();
    await supabase.auth.signOut();
  } catch (err) {
    console.error("Logout exception:", err);
  }
  redirect("/login");
}

/**
 * Server action to initiate password reset email.
 */
export async function forgotPasswordAction(
  prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const email = (formData.get("email") as string)?.trim();

  if (!email) {
    return { success: false, error: "Please enter your email address." };
  }

  let supabase;
  try {
    supabase = createServerClient();
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Supabase connection is not configured.",
    };
  }

  let origin = "http://localhost:3000";
  try {
    const headerList = headers();
    const host = headerList.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    origin = `${protocol}://${host}`;
  } catch {
    // default origin
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    message:
      "Password reset instructions have been sent to your email address.",
  };
}

/**
 * Server action to update password after reset link verification.
 */
export async function resetPasswordAction(
  prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || password.length < 6) {
    return {
      success: false,
      error: "New password must be at least 6 characters long.",
    };
  }

  if (password !== confirmPassword) {
    return { success: false, error: "Passwords do not match." };
  }

  let supabase;
  try {
    supabase = createServerClient();
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Supabase connection is not configured.",
    };
  }

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    message: "Password updated successfully. You can now sign in.",
    redirectUrl: "/login?reset=success",
  };
}
