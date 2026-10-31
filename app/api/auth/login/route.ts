import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, UserRole } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { role } = await req.json();

    if (!role || !["admin", "staff", "customer"].includes(role)) {
      return NextResponse.json({ error: "Invalid role specified" }, { status: 400 });
    }

    const redirectUrl = role === "customer" ? "/portal" : "/dashboard";
    const res = NextResponse.json({ success: true, redirect: redirectUrl });

    res.cookies.set(AUTH_COOKIE_NAME, role, {
      path: "/",
      httpOnly: false, // Accessible to client for simulation & SSR
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return res;
  } catch {
    return NextResponse.json({ error: "Failed to authenticate" }, { status: 500 });
  }
}

