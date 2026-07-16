import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { createServerSupabase } from "./supabase/server";
import { isSupabaseConfigured } from "./supabase/config";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  initials: string;
  color: string;
  role: string;
};

/** The validated auth user for this request, memoized with React `cache()` so
 *  the many callers within one render (layout + page + readers) share a SINGLE
 *  `auth.getUser()` network round-trip instead of one each — the main page-load
 *  latency win in live mode. Returns null in mock mode / when signed out. */
export const getAuthUser = cache(async (): Promise<User | null> => {
  if (!isSupabaseConfigured) return null;
  try {
    const sb = await createServerSupabase();
    const {
      data: { user },
    } = await sb.auth.getUser();
    return user ?? null;
  } catch {
    return null;
  }
});

/** Current signed-in user id, or undefined (mock mode / signed out). */
export async function getUserId(): Promise<string | undefined> {
  return (await getAuthUser())?.id;
}

export type Profile = {
  full_name: string;
  email: string;
  phone: string;
  dob: string; // yyyy-mm-dd for <input type="date">
  gender: string;
  role: string;
};

/** The signed-in user's editable profile, or null in mock/demo mode (the caller
 *  supplies role-appropriate demo defaults). Falls back to auth metadata if the
 *  profiles row is missing. */
export async function getMyProfile(): Promise<Profile | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const user = await getAuthUser();
    if (!user) return null;
    const sb = await createServerSupabase();
    const { data } = await sb
      .from("profiles")
      .select("full_name, email, phone, dob, gender, role")
      .eq("id", user.id)
      .maybeSingle();
    const meta = user.user_metadata ?? {};
    return {
      full_name: data?.full_name ?? (meta.full_name as string) ?? "",
      email: data?.email ?? user.email ?? "",
      phone: data?.phone ?? "",
      dob: data?.dob ?? "",
      gender: data?.gender ?? "",
      role: data?.role ?? (meta.role as string) ?? "patient",
    };
  } catch {
    return null;
  }
}

/** Full session user for headers/shells, or null. */
export async function getSessionUser(): Promise<SessionUser | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const user = await getAuthUser();
    if (!user) return null;
    const meta = user.user_metadata ?? {};
    return {
      id: user.id,
      name: (meta.full_name as string) || user.email || "Member",
      email: user.email ?? "",
      initials: (meta.initials as string) || (user.email ?? "AH").slice(0, 2).toUpperCase(),
      color: (meta.avatar_color as string) || "#0070d1",
      role: (meta.role as string) || "patient",
    };
  } catch {
    return null;
  }
}
