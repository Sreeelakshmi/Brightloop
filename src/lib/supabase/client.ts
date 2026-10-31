import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr";

function normalizeSupabaseUrl(url: string) {
  return url.trim().replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
}

/**
 * Creates a browser-side Supabase client using `@supabase/ssr`.
 *
 * Uses public credentials (URL and Publishable/Anon Key).
 * Safe to be called from Client Components and hooks.
 */
export function createBrowserClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!rawUrl) {
    throw new Error(
      "[Supabase Client] Missing environment variable: NEXT_PUBLIC_SUPABASE_URL. " +
        "Please define it in your .env.local file."
    );
  }

  if (!supabaseAnonKey) {
    throw new Error(
      "[Supabase Client] Missing environment variable: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. " +
        "Please define it in your .env.local file."
    );
  }

  const supabaseUrl = normalizeSupabaseUrl(rawUrl);

  return createSupabaseBrowserClient(supabaseUrl, supabaseAnonKey);
}

// Alias for standard createClient naming
export { createBrowserClient as createClient };
