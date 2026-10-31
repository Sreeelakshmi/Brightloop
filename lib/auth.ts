import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * ============================================================================
 * TODO: Member 1 / Auth Lead
 * Wire this contract to the official Supabase Auth session and app_metadata.
 *
 * Current implementation provides:
 * 1. Strongly typed role definitions (admin | staff | customer).
 * 2. Cookie-based session extraction compatible with Next.js App Router & middleware.
 * 3. Server-side role assertion guards (requireRole) for Page/Layout level security.
 * ============================================================================
 */

export type UserRole = "admin" | "staff" | "customer";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  customerId?: string;
  avatarUrl?: string;
}

export const AUTH_COOKIE_NAME = "brightloop_role";

const DEFAULT_USERS: Record<UserRole, AuthUser> = {
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
 * Server-side helper to read the current authenticated user from cookies.
 * In production, Member 1 should inspect the Supabase Auth session JWT / user_metadata.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = cookies();
  const roleCookie = cookieStore.get(AUTH_COOKIE_NAME)?.value as UserRole | undefined;

  if (!roleCookie || !DEFAULT_USERS[roleCookie]) {
    return null;
  }

  return DEFAULT_USERS[roleCookie];
}

/**
 * Server-side assertion guard to enforce role authorization.
 * Redirects to /login if unauthenticated, or to appropriate home if role mismatch.
 */
export async function requireAuth(allowedRoles?: UserRole[]): Promise<AuthUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If a Customer attempts to access Admin/Staff routes, redirect to /portal
    if (user.role === "customer") {
      redirect("/portal");
    }
    // If Staff/Admin attempts to access /portal, redirect to /dashboard
    if (user.role === "admin" || user.role === "staff") {
      redirect("/dashboard");
    }
    redirect("/login");
  }

  return user;
}

