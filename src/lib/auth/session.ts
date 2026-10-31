import { createServerClient } from "@/lib/supabase/server";
import { UserRole, Profile } from "@/types";
import { redirect } from "next/navigation";

/**
 * Returns the canonical redirect URL after login for a given role.
 * - admin -> /admin
 * - staff -> /staff
 * - customer -> /customer
 */
export function getRoleRedirectPath(role?: UserRole | string | null): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "staff":
      return "/staff";
    case "customer":
      return "/customer";
    default:
      return "/customer";
  }
}

/**
 * Retrieves the currently authenticated Supabase Auth user on the server.
 */
export async function getCurrentUser() {
  let supabase;
  try {
    supabase = createServerClient();
  } catch {
    return null;
  }

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}

/**
 * Retrieves the currently authenticated user and their profile from `public.profiles`.
 *
 * SECURITY REQUIREMENT:
 * Role authorization is strictly resolved from `public.profiles.role` in PostgreSQL.
 * User-editable `raw_user_meta_data` is NEVER trusted for role authorization to prevent
 * privilege escalation. Any account without an explicit admin or staff profile role defaults
 * strictly to "customer".
 */
export async function getCurrentProfile(): Promise<{
  user: any;
  profile: Profile;
} | null> {
  let supabase;
  try {
    supabase = createServerClient();
  } catch {
    return null;
  }

  const user = await getCurrentUser();
  if (!user) return null;

  try {
    const { data: dbProfile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    // STRICT: Only trust the role recorded in public.profiles
    let trustedRole: UserRole = "customer";
    if (
      dbProfile?.role &&
      (dbProfile.role === "admin" ||
        dbProfile.role === "staff" ||
        dbProfile.role === "customer")
    ) {
      trustedRole = dbProfile.role as UserRole;
    }

    if (error || !dbProfile) {
      // Fallback profile if profile row is still syncing; role is STRICTLY "customer"
      const fallbackProfile: Profile = {
        id: user.id,
        email: user.email || "",
        fullName: (user.user_metadata?.full_name as string) || null,
        role: "customer",
        createdAt: user.created_at,
      };
      return { user, profile: fallbackProfile };
    }

    const mappedProfile: Profile = {
      id: dbProfile.id,
      organizationId: dbProfile.organization_id || null,
      email: dbProfile.email || user.email || "",
      fullName:
        dbProfile.full_name ||
        (user.user_metadata?.full_name as string) ||
        null,
      avatarUrl: dbProfile.avatar_url || null,
      phone: dbProfile.phone || null,
      role: trustedRole,
      billingAddress: dbProfile.billing_address || {},
      metadata: dbProfile.metadata || {},
      createdAt: dbProfile.created_at || user.created_at,
      updatedAt: dbProfile.updated_at,
    };

    return { user, profile: mappedProfile };
  } catch {
    return {
      user,
      profile: {
        id: user.id,
        email: user.email || "",
        fullName: (user.user_metadata?.full_name as string) || null,
        role: "customer",
        createdAt: user.created_at,
      },
    };
  }
}

/**
 * Enforces authentication on server components / pages.
 * Redirects unauthenticated users to `/login`.
 */
export async function requireAuth(redirectTo?: string) {
  const authData = await getCurrentProfile();

  if (!authData) {
    const target = redirectTo
      ? `?redirectTo=${encodeURIComponent(redirectTo)}`
      : "";
    redirect(`/login${target}`);
  }

  return authData;
}

/**
 * Enforces role-based authorization on server components / pages.
 * If user lacks required role, redirects to their authorized role destination.
 * Customers attempting to access admin/staff routes are redirected to `/customer`.
 */
export async function requireRole(
  allowedRoles: UserRole[],
  fallbackUrl?: string
) {
  const { user, profile } = await requireAuth();

  if (!allowedRoles.includes(profile.role)) {
    const destination = fallbackUrl || getRoleRedirectPath(profile.role);
    redirect(destination);
  }

  return { user, profile };
}
