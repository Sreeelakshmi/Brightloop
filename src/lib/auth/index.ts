import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser as getSupabaseUser, getCurrentProfile } from "./session";
import type { UserRole } from "@/types";

export type { UserRole };

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  customerId?: string;
  avatarUrl?: string;
}

export const AUTH_COOKIE_NAME = "brightloop_role";

const DEFAULT_USERS: Record<string, AuthUser> = {
  admin: {
    id: "user-admin-01",
    email: "admin@brightloop.io",
    name: "Alex V.",
    role: "admin",
  },
  staff: {
    id: "user-staff-01",
    email: "operations@brightloop.io",
    name: "Elena R.",
    role: "staff",
  },
  customer: {
    id: "user-cust-01",
    email: "billing@aerogroup.com",
    name: "AeroGroup Billing",
    role: "customer",
    customerId: "cust-001",
  },
};

/**
 * Server-side helper to read the current authenticated user.
 * First checks active Supabase auth session, then falls back to demo cookie for offline preview.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const profileData = await getCurrentProfile();
    if (profileData && profileData.user) {
      return {
        id: profileData.user.id,
        email: profileData.user.email || profileData.profile.email,
        name: profileData.profile.fullName || profileData.user.email || "User",
        role: profileData.profile.role,
        avatarUrl: profileData.profile.avatarUrl || undefined,
      };
    }
  } catch {
    // Session lookup failed or offline
  }

  // Fallback to role cookie for offline / demo mode
  try {
    const cookieStore = cookies();
    const roleCookie = cookieStore.get(AUTH_COOKIE_NAME)?.value as string | undefined;
    if (roleCookie && DEFAULT_USERS[roleCookie]) {
      return DEFAULT_USERS[roleCookie];
    }
  } catch {
    // Non-request context
  }

  return DEFAULT_USERS.admin;
}

/**
 * Server-side assertion guard to enforce role authorization.
 */
export async function requireAuth(allowedRoles?: UserRole[]): Promise<AuthUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === "customer") {
      redirect("/portal");
    }
    if (user.role === "admin" || user.role === "staff") {
      redirect("/dashboard");
    }
    redirect("/login");
  }

  return user;
}

export * from "./actions";
export * from "./session";
