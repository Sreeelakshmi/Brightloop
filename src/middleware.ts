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

  const isAdminRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/reports") ||
    pathname.startsWith("/customers") ||
    pathname.startsWith("/subscriptions") ||
    pathname.startsWith("/invoices") ||
    pathname.startsWith("/payments");

  // CSV export is admin/staff only — block customers explicitly
  const isExportRoute = pathname.startsWith("/api/reports/export");

  const isPortalRoute = pathname.startsWith("/portal");
  const isLoginRoute = pathname === "/login";
  const isRootRoute = pathname === "/";

  // 1. Unauthenticated users
  if (!isAuthenticated) {
    if (isAdminRoute || isPortalRoute || isRootRoute || isExportRoute) {
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
  if (roleCookie === "customer" && isAdminRoute) {
    return NextResponse.redirect(new URL("/portal", request.url));
  }

  // 4. Customer trying to access the CSV export API route
  if (roleCookie === "customer" && isExportRoute) {
    return NextResponse.json(
      { error: "Forbidden: insufficient role" },
      { status: 403 }
    );
  }

  // 5. Admin or Staff trying to access Customer Portal routes
  if ((roleCookie === "admin" || roleCookie === "staff") && isPortalRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/reports/:path*",
    "/customers/:path*",
    "/subscriptions/:path*",
    "/invoices/:path*",
    "/payments/:path*",
    "/portal/:path*",
    "/login",
    "/api/reports/export",
  ],
};
