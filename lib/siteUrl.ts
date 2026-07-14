import { headers } from "next/headers";

/* Absolute origin used to build auth email links (confirmation, password reset).
   Priority:
     1. NEXT_PUBLIC_SITE_URL — set this in production to the canonical deployed
        URL so email links always point at the live site, never a request host.
     2. Vercel's deployment URL (auto-set in Vercel builds).
     3. The incoming request's host (correct for local dev).
   Supabase must also allowlist this origin under Auth → URL Configuration. */
export async function getSiteOrigin(): Promise<string> {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;

  const h = await headers();
  return `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
}
