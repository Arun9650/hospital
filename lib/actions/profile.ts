"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type Result = { ok: boolean; error?: string };

function initialsFrom(name: string, fallback: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return fallback;
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

/** Save the signed-in user's profile. No-ops in mock mode. Keeps auth metadata
 *  (name/initials) in sync so the dashboard shell reflects the change, then
 *  revalidates so the new name shows without a manual reload. */
export async function updateProfile(input: {
  full_name: string;
  phone: string;
  dob: string;
  gender: string;
}): Promise<Result> {
  const full_name = input.full_name.trim();
  if (!full_name) return { ok: false, error: "Name is required." };
  if (!isSupabaseConfigured) return { ok: true }; // demo mode — nothing to persist

  try {
    const sb = await createServerSupabase();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) return { ok: false, error: "You're not signed in." };

    const initials = initialsFrom(full_name, (user.email ?? "AH").slice(0, 2).toUpperCase());
    const { error } = await sb
      .from("profiles")
      .update({
        full_name,
        phone: input.phone.trim() || null,
        dob: input.dob || null,
        gender: input.gender || null,
        initials,
      })
      .eq("id", user.id);
    if (error) return { ok: false, error: error.message };

    await sb.auth.updateUser({ data: { full_name, initials } });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't save your profile. Please try again." };
  }
}

/** Change the signed-in user's password. No-ops in mock mode. */
export async function changePassword(newPassword: string): Promise<Result> {
  if (newPassword.length < 8) return { ok: false, error: "Password must be at least 8 characters." };
  if (!isSupabaseConfigured) return { ok: true };
  try {
    const sb = await createServerSupabase();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) return { ok: false, error: "You're not signed in." };
    const { error } = await sb.auth.updateUser({ password: newPassword });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't update your password. Please try again." };
  }
}
