import { createServerClient as createSSRServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

/**
 * Authenticated Supabase Server Client
 *
 * Configured for server components, route handlers, and server actions.
 * Operates in the context of the authenticated user's session cookies,
 * ensuring PostgreSQL Row Level Security (RLS) is strictly enforced.
 */
export async function createServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  try {
    const cookieStore = cookies();
    return createSSRServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Can be ignored if called from a Server Component
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // Can be ignored if called from a Server Component
          }
        },
      },
    });
  } catch {
    // Fallback for non-request environments (e.g. scripts or build time)
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
}

/**
 * Privileged Admin Supabase Client (Server-Only)
 *
 * Exclusively used for trusted, backend system tasks such as the recurring billing
 * cron engine where no end-user session exists.
 *
 * NEVER expose this client or the service role key to client components or customer requests.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export interface AuthenticatedUserContext {
  id: string;
  email?: string;
  role: string;
  name?: string;
}

/**
 * Retrieves the currently authenticated user and verifies their database profile role.
 */
export async function getAuthenticatedUser(): Promise<AuthenticatedUserContext | null> {
  const client = await createServerClient();
  if (!client) return null;

  try {
    const {
      data: { user },
      error,
    } = await client.auth.getUser();

    if (error || !user) return null;

    const { data: profile } = await client
      .from("profiles")
      .select("id, role, email, name, full_name")
      .eq("id", user.id)
      .maybeSingle();

    return {
      id: user.id,
      email: user.email,
      role: profile?.role || "customer",
      name: profile?.name || profile?.full_name || user.email,
    };
  } catch {
    return null;
  }
}

/**
 * Asserts that the caller has an administrative or staff role.
 * Throws a descriptive error if the check fails.
 */
export async function requireStaffOrAdmin(): Promise<AuthenticatedUserContext> {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    throw new Error("Unauthorized: A valid authenticated session is required.");
  }

  if (!["admin", "owner", "finance", "staff"].includes(auth.role)) {
    throw new Error(`Forbidden: User role '${auth.role}' is not authorized to perform this operation.`);
  }

  return auth;
}
