import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME, UserRole } from "@/lib/auth";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const roleCookie = request.cookies.get(AUTH_COOKIE_NAME)?.value as
    | UserRole
    | undefined;

  const isAuthenticated = Boolean(
    roleCookie && ["admin", "staff", "customer"].includes(roleCookie)
  );

  const isAdminOnlyRoute =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/settings");

  const isStaffRoute = pathname.startsWith("/staff");

  const isCustomerExclusiveRoute =
    pathname === "/customer" || pathname.startsWith("/customer/");

  const isAdminDashboardRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/reports") ||
    pathname.startsWith("/customers") ||
    pathname.startsWith("/subscriptions") ||
    pathname.startsWith("/invoices") ||
    pathname.startsWith("/payments") ||
    pathname.startsWith("/products") ||
    pathname.startsWith("/plans") ||
    pathname.startsWith("/quotations");

  const isPortalRoute = pathname.startsWith("/portal");
  const isExportRoute = pathname.startsWith("/api/reports/export");
  const isLoginRoute = pathname === "/login";
  const isRootRoute = pathname === "/";

  // 1. Unauthenticated users: redirect to /login with ?redirect=...
  if (!isAuthenticated) {
    if (
      isAdminOnlyRoute ||
      isStaffRoute ||
      isCustomerExclusiveRoute ||
      isAdminDashboardRoute ||
      isPortalRoute ||
      isRootRoute ||
      isExportRoute
    ) {
      const loginUrl = new URL("/login", request.url);
      if (!isRootRoute) {
        loginUrl.searchParams.set("redirect", pathname);
      }
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // 2. Authenticated users landing on /login or root /
  if (isLoginRoute || isRootRoute) {
    const targetUrl =
      roleCookie === "customer"
        ? new URL("/portal", request.url)
        : new URL("/dashboard", request.url);
    return NextResponse.redirect(targetUrl);
  }

  // 3. Customer trying to access Admin/Staff routes
  if (roleCookie === "customer") {
    if (isAdminDashboardRoute || isAdminOnlyRoute || isStaffRoute) {
      return NextResponse.redirect(new URL("/portal", request.url));
    }
    if (isExportRoute) {
      return NextResponse.json(
        { error: "Forbidden: insufficient role" },
        { status: 403 }
      );
    }
  }

  // 4. Staff route protections
  if (roleCookie === "staff") {
    if (isAdminOnlyRoute) {
      return NextResponse.redirect(new URL("/staff", request.url));
    }
    if (isPortalRoute) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    if (isCustomerExclusiveRoute) {
      return NextResponse.redirect(new URL("/staff", request.url));
    }
  }

  // 5. Admin route protections
  if (roleCookie === "admin") {
    if (isPortalRoute) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    if (isCustomerExclusiveRoute) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/admin/:path*",
    "/staff/:path*",
    "/customer/:path*",
    "/portal/:path*",
    "/dashboard/:path*",
    "/reports/:path*",
    "/customers/:path*",
    "/subscriptions/:path*",
    "/invoices/:path*",
    "/payments/:path*",
    "/products/:path*",
    "/plans/:path*",
    "/quotations/:path*",
    "/settings/:path*",
    "/login",
    "/api/reports/export",
  ],
};
