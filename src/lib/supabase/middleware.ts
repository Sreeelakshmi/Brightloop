import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
};

function normalizeSupabaseUrl(url: string) {
  return url.trim().replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
}

function createRedirectWithCookies(
  url: URL | string,
  request: NextRequest,
  supabaseResponse: NextResponse
) {
  const redirectResponse = NextResponse.redirect(
    typeof url === "string" ? new URL(url, request.url) : url
  );
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
  });
  return redirectResponse;
}

/**
 * Refreshes user auth tokens in cookies on incoming requests and enforces
 * authentication and role-based route access controls.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If credentials are not configured, allow request to proceed (fallback)
  if (!rawUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  const supabaseUrl = normalizeSupabaseUrl(rawUrl);

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Calling getUser refreshes the session token and populates auth cookies
  let user = null;
  try {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    user = authUser;
  } catch {
    user = null;
  }

  const { pathname, search } = request.nextUrl;

  const isAuthPage =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password";

  const isProtectedPath =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/staff") ||
    pathname.startsWith("/customer") ||
    pathname.startsWith("/portal") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/products") ||
    pathname.startsWith("/plans") ||
    pathname.startsWith("/customers") ||
    pathname.startsWith("/quotations") ||
    pathname.startsWith("/subscriptions") ||
    pathname.startsWith("/invoices") ||
    pathname.startsWith("/payments") ||
    pathname.startsWith("/settings");

  // 1. Unauthenticated users visiting protected pages -> redirect to /login
  if (!user && isProtectedPath) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname + search);
    return createRedirectWithCookies(loginUrl, request, supabaseResponse);
  }

  // 2. Authenticated users
  if (user) {
    // SECURITY: Resolve user role strictly from public.profiles table.
    // NEVER trust client user_metadata for role authorization.
    let role = "customer";
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (
        profile?.role &&
        ["admin", "staff", "customer"].includes(profile.role)
      ) {
        role = profile.role;
      }
    } catch {
      role = "customer";
    }

    const defaultRoleHome =
      role === "admin" ? "/admin" : role === "staff" ? "/staff" : "/customer";

    // A. Logged in users trying to access login/signup/register -> redirect to role home
    if (pathname === "/login" || pathname === "/signup" || pathname === "/register") {
      return createRedirectWithCookies(
        new URL(defaultRoleHome, request.url),
        request,
        supabaseResponse
      );
    }

    // B. Customers cannot access admin/staff dashboard routes
    const isAdminOrStaffPath =
      pathname.startsWith("/admin") ||
      pathname.startsWith("/staff") ||
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/products") ||
      pathname.startsWith("/plans") ||
      pathname.startsWith("/customers") ||
      pathname.startsWith("/quotations") ||
      pathname.startsWith("/subscriptions") ||
      pathname.startsWith("/invoices") ||
      pathname.startsWith("/payments") ||
      pathname.startsWith("/settings");

    if (role === "customer" && isAdminOrStaffPath) {
      return createRedirectWithCookies(
        new URL("/customer", request.url),
        request,
        supabaseResponse
      );
    }

    // C. Staff cannot access admin-only pages
    if (role === "staff" && (pathname.startsWith("/admin") || pathname.startsWith("/settings"))) {
      return createRedirectWithCookies(
        new URL("/staff", request.url),
        request,
        supabaseResponse
      );
    }
  }

  return supabaseResponse;
}
