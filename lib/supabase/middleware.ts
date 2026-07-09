import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./config";

/* Public pages that never require a session. Everything under /patient,
   /doctor and /admin is gated, except the doctor registration flow. */
const PUBLIC_PREFIXES = ["/login", "/register", "/doctor/register"];

/* Which role each protected area belongs to. */
const ROLE_AREAS: { prefix: string; role: string; home: string }[] = [
  { prefix: "/patient", role: "patient", home: "/patient/dashboard" },
  { prefix: "/doctor", role: "doctor", home: "/doctor/dashboard" },
  { prefix: "/admin", role: "admin", home: "/admin/dashboard" },
];

function isPublic(pathname: string) {
  return PUBLIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

/* Refreshes the Supabase auth session on every request so Server Components
   always see a valid session, and gates protected areas by sign-in + role.
   No-op auth when Supabase isn't configured (mock/demo mode). */
export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({ request });

  if (!isSupabaseConfigured) return response;

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Touch the user to trigger a token refresh when needed.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // The shared consultation room is open to any signed-in user (patient OR
  // doctor), so it isn't tied to a single role area.
  if (pathname.startsWith("/consultation") && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const area = ROLE_AREAS.find(
    (a) => pathname === a.prefix || pathname.startsWith(a.prefix + "/")
  );
  const guarded = area && !isPublic(pathname);

  // Not signed in → send to login (remembering where they were headed).
  if (guarded && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Signed in but wrong role for this area → bounce to their own home.
  if (guarded && user) {
    const role = (user.user_metadata?.role as string) ?? "patient";
    if (role !== area.role) {
      const home = ROLE_AREAS.find((a) => a.role === role)?.home ?? "/";
      const url = request.nextUrl.clone();
      url.pathname = home;
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  // Already signed in and visiting login/register → skip straight to dashboard.
  if (user && (pathname === "/login" || pathname === "/register")) {
    const role = (user.user_metadata?.role as string) ?? "patient";
    const home = ROLE_AREAS.find((a) => a.role === role)?.home ?? "/patient/dashboard";
    const url = request.nextUrl.clone();
    url.pathname = home;
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
