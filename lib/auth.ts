import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getMockDb } from "./mock/db";

/**
 * ============================================================================
 * Auth Session & Identity Layer
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
export const USER_ID_COOKIE = "brightloop_user_id";

const DEFAULT_USERS: Record<UserRole, AuthUser> = {
  admin: {
    id: "usr-admin-01",
    email: "admin@brightloop.io",
    name: "Alex V.",
    role: "admin",
  },
  staff: {
    id: "usr-staff-01",
    email: "operations@brightloop.io",
    name: "Elena R.",
    role: "staff",
  },
  customer: {
    id: "usr-cust-01",
    email: "billing@aerogroup.com",
    name: "AeroGroup Billing",
    role: "customer",
    customerId: "cust-001",
  },
};

/**
 * Server-side helper to read the current authenticated user from cookies.
 * In mock mode: checks mock database for user matching brightloop_user_id cookie,
 * or falls back to DEFAULT_USERS for role cookie.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = cookies();
    const roleCookie = cookieStore.get(AUTH_COOKIE_NAME)?.value as UserRole | undefined;
    const userIdCookie = cookieStore.get(USER_ID_COOKIE)?.value;

    if (!roleCookie || !["admin", "staff", "customer"].includes(roleCookie)) {
      return null;
    }

    if (userIdCookie) {
      try {
        const db = getMockDb();
        const found = db.users.find((u) => u.id === userIdCookie && u.status === "active");
        if (found) {
          return {
            id: found.id,
            email: found.email,
            name: found.name,
            role: found.role,
            customerId: found.customerId,
          };
        }
      } catch (err) {
        // Fallback to role-based default
      }
    }

    return DEFAULT_USERS[roleCookie] || null;
  } catch {
    return null;
  }
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
