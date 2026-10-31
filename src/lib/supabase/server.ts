import { createServerClient as createSupabaseServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<ReturnType<typeof cookies>["set"]>[2];
};

function normalizeSupabaseUrl(url: string) {
  return url.trim().replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
}

/**
 * Creates a server-side Supabase client with secure cookie-based session handling.
 * Compatible with Next.js App Router (Server Components, Server Actions, Route Handlers).
 */
export function createServerClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!rawUrl || !supabaseAnonKey) {
    return null as any;
  }

  const supabaseUrl = normalizeSupabaseUrl(rawUrl);

  try {
    const cookieStore = cookies();
    return createSupabaseServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Safe to ignore in Server Components
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // Safe to ignore in Server Components
          }
        },
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Safe to ignore in Server Components
          }
        },
      },
    });
  } catch {
    // Fallback for non-request environments (e.g. scripts or build time)
    return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
}

/**
 * Creates a privileged Supabase client using the Service Role Key.
 *
 * CAUTION: Bypasses Row Level Security (RLS).
 * MUST ONLY BE CALLED ON THE SERVER for admin backend operations,
 * background sync jobs, database migrations, or cron tasks.
 */
export function createAdminClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!rawUrl || !serviceRoleKey) {
    return null as any;
  }

  const supabaseUrl = normalizeSupabaseUrl(rawUrl);

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
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

// Alias for standard createClient naming
export { createServerClient as createClient };
