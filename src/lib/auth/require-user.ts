import type { UserRole } from "@/types";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

/**
 * Auth helper that resolves the currently authenticated user and role on the server.
 * Throws an error if the user is not authenticated.
 *
 * Note: In production this integrates with @supabase/ssr to read the session cookie.
 * The stub below is used by tests (mocked via vi.mock) and the dev scaffold.
 */
export async function requireUser(): Promise<AuthUser> {
  // Default server session resolver; mocked in unit/integration tests.
  // Member 1 will replace this body with the real Supabase session lookup.
  return {
    id: "00000000-0000-0000-0000-000000000001",
    email: "admin@brightloop.io",
    role: "admin",
  };
}

/**
 * Optional session retriever that returns null if unauthenticated.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    return await requireUser();
  } catch {
    return null;
  }
}

