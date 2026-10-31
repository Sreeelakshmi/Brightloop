import { describe, it, expect } from "vitest";
import { middleware } from "@/middleware";
import { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth";

function createMockRequest(url: string, role?: string): NextRequest {
  const req = new NextRequest(new URL(url, "http://localhost:3000"));
  if (role) {
    req.cookies.set(AUTH_COOKIE_NAME, role);
  }
  return req;
}

describe("Server-Side Route Protection & Middleware Engine", () => {
  it("redirects unauthenticated user from /dashboard to /login with redirect param", () => {
    const req = createMockRequest("/dashboard");
    const res = middleware(req);

    expect(res.status).toBe(307);
    const location = res.headers.get("location");
    expect(location).toContain("/login");
    expect(location).toContain("redirect=%2Fdashboard");
  });

  it("redirects unauthenticated user from /portal to /login with redirect param", () => {
    const req = createMockRequest("/portal");
    const res = middleware(req);

    expect(res.status).toBe(307);
    const location = res.headers.get("location");
    expect(location).toContain("/login");
    expect(location).toContain("redirect=%2Fportal");
  });

  it("blocks customer from accessing /dashboard and redirects to /portal", () => {
    const req = createMockRequest("/dashboard", "customer");
    const res = middleware(req);

    expect(res.status).toBe(307);
    const location = res.headers.get("location");
    expect(location).toBe("http://localhost:3000/portal");
  });

  it("blocks customer from accessing /reports and redirects to /portal", () => {
    const req = createMockRequest("/reports", "customer");
    const res = middleware(req);

    expect(res.status).toBe(307);
    const location = res.headers.get("location");
    expect(location).toBe("http://localhost:3000/portal");
  });

  it("blocks staff/admin from accessing /portal and redirects to /dashboard", () => {
    const adminReq = createMockRequest("/portal", "admin");
    const adminRes = middleware(adminReq);

    expect(adminRes.status).toBe(307);
    expect(adminRes.headers.get("location")).toBe("http://localhost:3000/dashboard");

    const staffReq = createMockRequest("/portal/invoices", "staff");
    const staffRes = middleware(staffReq);

    expect(staffRes.status).toBe(307);
    expect(staffRes.headers.get("location")).toBe("http://localhost:3000/dashboard");
  });

  it("allows admin/staff to access /dashboard and /reports", () => {
    const adminReq = createMockRequest("/dashboard", "admin");
    const adminRes = middleware(adminReq);
    expect(adminRes.headers.get("location")).toBeNull();

    const staffReq = createMockRequest("/reports", "staff");
    const staffRes = middleware(staffReq);
    expect(staffRes.headers.get("location")).toBeNull();
  });

  it("allows customer to access /portal routes", () => {
    const portalReq = createMockRequest("/portal", "customer");
    const portalRes = middleware(portalReq);
    expect(portalRes.headers.get("location")).toBeNull();

    const invoicesReq = createMockRequest("/portal/invoices", "customer");
    const invoicesRes = middleware(invoicesReq);
    expect(invoicesRes.headers.get("location")).toBeNull();
  });

  it("redirects authenticated user away from /login to their respective home", () => {
    const adminLogin = createMockRequest("/login", "admin");
    const adminRes = middleware(adminLogin);
    expect(adminRes.status).toBe(307);
    expect(adminRes.headers.get("location")).toBe("http://localhost:3000/dashboard");

    const customerLogin = createMockRequest("/login", "customer");
    const custRes = middleware(customerLogin);
    expect(custRes.status).toBe(307);
    expect(custRes.headers.get("location")).toBe("http://localhost:3000/portal");
  });
});

