/**
 * Supabase Server Client Placeholder
 *
 * This server-side client will be configured by Member 1 on the `feature/admin-backend` branch
 * for server components, route handlers, and server actions using `@supabase/ssr`.
 */

export function createServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    // Return null or placeholder during skeleton phase
    return null;
  }

  // To be initialized by Member 1:
  // return createServerClient(...)
  return null;
}
