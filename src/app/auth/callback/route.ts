import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/customer";

  if (code) {
    try {
      const supabase = createServerClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error) {
        // Forward user to destination specified in `next`
        const destination = next.startsWith("/") ? next : `/${next}`;
        return NextResponse.redirect(new URL(destination, request.url));
      } else {
        console.error("Auth callback code exchange error:", error.message);
      }
    } catch (err) {
      console.error("Auth callback unexpected exception:", err);
    }
  }

  // Redirect to login with friendly error message if code exchange failed
  return NextResponse.redirect(
    new URL(
      `/login?error=${encodeURIComponent(
        "Authentication link has expired or is invalid. Please sign in or request a new link."
      )}`,
      request.url
    )
  );
}

