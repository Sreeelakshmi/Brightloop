import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    await supabase.auth.signOut();
  } catch (err) {
    console.error("Logout error:", err);
  }

  return NextResponse.redirect(new URL("/login", request.url), {
    status: 303,
  });
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    await supabase.auth.signOut();
  } catch (err) {
    console.error("Logout error:", err);
  }

  return NextResponse.redirect(new URL("/login", request.url));
}

