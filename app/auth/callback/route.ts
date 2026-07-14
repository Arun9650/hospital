import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/* Auth redirect target for email links (password reset, and email confirmation).
   Exchanges the PKCE `code` for a session cookie, then forwards to `next`. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const safeNext = next.startsWith("/") ? next : "/";

  if (code && isSupabaseConfigured) {
    const sb = await createServerSupabase();
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent("This link is invalid or has expired.")}`
      );
    }
  }
  return NextResponse.redirect(`${origin}${safeNext}`);
}
