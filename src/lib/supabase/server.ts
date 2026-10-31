import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
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
 *
 * Uses public credentials (URL and Publishable/Anon Key) and user cookies.
 */
export function createServerClient() {
  const cookieStore = cookies();

  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!rawUrl) {
    throw new Error(
      "[Supabase Server] Missing environment variable: NEXT_PUBLIC_SUPABASE_URL. " +
        "Please define it in your .env.local file."
    );
  }

  if (!supabaseAnonKey) {
    throw new Error(
      "[Supabase Server] Missing environment variable: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. " +
        "Please define it in your .env.local file."
    );
  }

  const supabaseUrl = normalizeSupabaseUrl(rawUrl);

  return createSupabaseServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be safely ignored when middleware or Server Actions refresh sessions.
        }
      },
    },
  });
}

/**
 * Creates a privileged Supabase client using the Service Role Key.
 *
 * CAUTION: Bypasses Row Level Security (RLS).
 * MUST ONLY BE CALLED ON THE SERVER for admin backend operations,
 * background sync jobs, database migrations, or cron tasks.
 * NEVER expose this or call this from client-facing code.
 */
export function createAdminClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!rawUrl) {
    throw new Error(
      "[Supabase Admin] Missing environment variable: NEXT_PUBLIC_SUPABASE_URL. " +
        "Please define it in your .env.local file."
    );
  }

  if (!serviceRoleKey) {
    throw new Error(
      "[Supabase Admin] Missing environment variable: SUPABASE_SERVICE_ROLE_KEY. " +
        "Privileged admin operations require this server-only secret in .env.local."
    );
  }

  const supabaseUrl = normalizeSupabaseUrl(rawUrl);

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Alias for standard createClient naming
export { createServerClient as createClient };
