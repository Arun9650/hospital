"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { firstError, maxLen, required } from "@/lib/validate";
import { logAudit } from "@/lib/audit";
import { specialties } from "@/lib/data";

type Result = { ok: boolean; error?: string };

function initialsFrom(name: string, fallback: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return fallback;
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

/** Match a specialty name to a known slug (FK to specialties); null if custom. */
function specialtySlugFor(name: string): string | null {
  return specialties.find((s) => s.name === name)?.slug ?? null;
}

const ALL_MODES = ["Video", "Audio", "Chat", "In-person"] as const;
type Mode = (typeof ALL_MODES)[number];

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
  const err = firstError(
    required(full_name, "Name"),
    maxLen(full_name, 100, "Name"),
    maxLen(input.phone, 30, "Phone"),
    maxLen(input.gender, 20, "Gender"),
  );
  if (err) return { ok: false, error: err };
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
    await logAudit(sb, "profile.update", "profile", user.id, {});
    revalidatePath("/", "layout");
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't save your profile. Please try again." };
  }
}

/** Save a doctor's full profile — personal fields on `profiles` AND the public
 *  catalog fields on `doctors` (scoped to their own row via profile_id). Keeps
 *  name/initials in sync across profiles, the catalog, and auth metadata so the
 *  shell and the patient-facing card all reflect the change. No-ops in mock
 *  mode. Rating/reviews/verified are trust signals — deliberately NOT editable. */
export async function updateDoctorProfile(input: {
  full_name: string;
  phone: string;
  dob: string;
  gender: string;
  specialty: string;
  qualifications: string;
  experience: number;
  fee: number;
  location: string;
  languages: string[];
  modes: string[];
  about: string;
  tags: string[];
}): Promise<Result> {
  const full_name = input.full_name.trim();
  const modes = input.modes.filter((m): m is Mode => (ALL_MODES as readonly string[]).includes(m));
  const err = firstError(
    required(full_name, "Name"),
    maxLen(full_name, 100, "Name"),
    maxLen(input.phone, 30, "Phone"),
    maxLen(input.gender, 20, "Gender"),
    required(input.specialty, "Specialty"),
    maxLen(input.qualifications, 200, "Qualifications"),
    maxLen(input.location, 120, "Location"),
    maxLen(input.about, 2000, "About"),
  );
  if (err) return { ok: false, error: err };
  if (input.experience < 0 || input.experience > 80) return { ok: false, error: "Experience looks out of range." };
  if (input.fee < 0 || input.fee > 100000) return { ok: false, error: "Fee looks out of range." };
  if (!isSupabaseConfigured) return { ok: true }; // demo mode — nothing to persist

  try {
    const sb = await createServerSupabase();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) return { ok: false, error: "You're not signed in." };

    const initials = initialsFrom(full_name, (user.email ?? "DR").slice(0, 2).toUpperCase());

    // Personal fields live on the shared profiles row.
    const { error: pErr } = await sb
      .from("profiles")
      .update({
        full_name,
        phone: input.phone.trim() || null,
        dob: input.dob || null,
        gender: input.gender || null,
        initials,
      })
      .eq("id", user.id);
    if (pErr) return { ok: false, error: pErr.message };

    // Catalog fields live on the doctor's own row (scoped by profile_id).
    const { error: dErr } = await sb
      .from("doctors")
      .update({
        name: full_name,
        specialty: input.specialty,
        specialty_slug: specialtySlugFor(input.specialty),
        qualifications: input.qualifications.trim(),
        experience: Math.round(input.experience),
        fee: Math.round(input.fee),
        location: input.location.trim(),
        languages: input.languages.map((s) => s.trim()).filter(Boolean),
        modes,
        about: input.about.trim(),
        tags: input.tags.map((s) => s.trim()).filter(Boolean),
        initials,
      })
      .eq("profile_id", user.id);
    if (dErr) return { ok: false, error: dErr.message };

    await sb.auth.updateUser({ data: { full_name, initials } });
    await logAudit(sb, "doctor.profile.update", "doctor", user.id, {});
    revalidatePath("/", "layout");
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't save your profile. Please try again." };
  }
}

/** Subscribe to / cancel Aria Plus. Membership lives in auth metadata
 *  (`user_metadata.plan`) — same no-migration approach as `role` — so
 *  getSessionUser picks it up app-wide. No-ops in mock mode.
 *  ponytail: no real payment — booking is already mock-pay in this app; wire a
 *  processor here (and a `current_period_end`) when payments go live. */
export async function setPlan(plan: "plus" | "free"): Promise<Result> {
  if (plan !== "plus" && plan !== "free") return { ok: false, error: "Invalid plan." };
  if (!isSupabaseConfigured) return { ok: true };
  try {
    const sb = await createServerSupabase();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) return { ok: false, error: "You're not signed in." };
    const { error } = await sb.auth.updateUser({ data: { plan } });
    if (error) return { ok: false, error: error.message };
    await logAudit(sb, plan === "plus" ? "plan.subscribe" : "plan.cancel", "profile", user.id, { plan });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't update your plan. Please try again." };
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
