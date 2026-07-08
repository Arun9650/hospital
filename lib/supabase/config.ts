/* -------------------------------------------------------------------------
   Central place to read Supabase env + decide whether it's configured.

   The whole app degrades gracefully to mock data (lib/data.ts) whenever
   Supabase is NOT configured, so the build stays green and the demo keeps
   working until real keys are added to .env.local.
   ---------------------------------------------------------------------- */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

function looksReal(v: string) {
  return (
    v.length > 0 &&
    !v.includes("your-") &&
    !v.includes("YOUR_") &&
    v !== "changeme"
  );
}

/** True only when both env vars are present and not placeholders. */
export const isSupabaseConfigured =
  looksReal(SUPABASE_URL) && looksReal(SUPABASE_ANON_KEY);
