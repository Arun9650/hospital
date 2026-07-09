"use server";

import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { specialties } from "@/lib/data";

function initialsFrom(name: string, email: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  if (parts.length === 1 && parts[0]) return parts[0].slice(0, 2).toUpperCase();
  return (email.slice(0, 2) || "AH").toUpperCase();
}

/** URL-safe slug from a name, e.g. "Dr. Jane Doe" → "dr-jane-doe". */
function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Match a specialty name (as picked in the form) to an existing slug. */
function specialtySlugFor(name: string) {
  return specialties.find((s) => s.name === name)?.slug ?? null;
}

type Supabase = Awaited<ReturnType<typeof createServerSupabase>>;
type AuthUser = { id: string; email?: string | null; user_metadata?: Record<string, unknown> };

/* Make sure a signed-in doctor has a row in the public `doctors` catalog so
   patients can find and book them. Idempotent — safe to call on every sign-in.
   Backfills existing doctor accounts created before catalog rows were added. */
async function ensureDoctorRow(sb: Supabase, user: AuthUser) {
  const meta = user.user_metadata ?? {};
  const { data: existing } = await sb
    .from("doctors")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();
  if (existing) return;

  const fullName = (meta.full_name as string) || user.email || "Doctor";
  const specialty = (meta.specialty as string) || "General Physician";
  await sb.from("doctors").insert({
    id: `${slugify(fullName) || "doctor"}-${user.id.slice(0, 6)}`,
    profile_id: user.id,
    name: fullName,
    specialty,
    specialty_slug: specialtySlugFor(specialty),
    qualifications: (meta.qualifications as string) || "",
    experience: Number(meta.experience) || 0,
    fee: Number(meta.fee) || 0,
    initials: (meta.initials as string) || initialsFrom(fullName, user.email ?? ""),
    photo: (meta.avatar_color as string) || "#0070d1",
    verified: true,
    next_slot: "Today",
    modes: ["Video", "Audio", "Chat"],
    languages: ["English"],
    about: `${fullName} is a ${specialty} on Aria Health.`,
  });
}

const HOME_BY_ROLE: Record<string, string> = {
  patient: "/patient/dashboard",
  doctor: "/doctor/dashboard",
  admin: "/admin/dashboard",
};

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");

  if (isSupabaseConfigured) {
    const sb = await createServerSupabase();
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
    const role = (data.user?.user_metadata?.role as string) ?? "patient";
    // Backfill the catalog row for doctors (covers email-confirmed sign-ups and
    // accounts created before doctors were listed automatically).
    if (role === "doctor" && data.user) await ensureDoctorRow(sb, data.user);
    if (next.startsWith("/")) redirect(next);
    redirect(HOME_BY_ROLE[role] ?? "/patient/dashboard");
  }
  redirect(next.startsWith("/") ? next : "/patient/dashboard");
}

export async function signUpPatient(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();

  if (isSupabaseConfigured) {
    const sb = await createServerSupabase();
    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: "patient",
          initials: initialsFrom(fullName, email),
          avatar_color: "#0070d1",
        },
      },
    });
    if (error) redirect(`/register?error=${encodeURIComponent(error.message)}`);
    // Email confirmation on → no session yet. Tell them to check their inbox.
    if (!data.session) redirect(`/login?check_email=${encodeURIComponent(email)}`);
  }
  redirect("/patient/dashboard");
}

export async function signUpDoctor(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const specialty = String(formData.get("specialty") ?? "").trim();
  const experience = Number(formData.get("experience") ?? 0) || 0;
  const fee = Number(formData.get("fee") ?? 0) || 0;
  const qualifications = String(formData.get("qualifications") ?? "").trim();

  if (isSupabaseConfigured) {
    const sb = await createServerSupabase();
    const initials = initialsFrom(fullName, email);
    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: "doctor",
          initials,
          avatar_color: "#0070d1",
          // Stored so the catalog row can be (re)built at sign-in if needed.
          specialty: specialty || "General Physician",
          experience,
          fee,
          qualifications,
        },
      },
    });
    if (error) redirect(`/doctor/register?error=${encodeURIComponent(error.message)}`);

    // Email confirmation on → no session yet. Tell them to check their inbox.
    // (The catalog row is created once they confirm and sign in.)
    if (!data.session) redirect(`/login?check_email=${encodeURIComponent(email)}`);

    // Add the doctor to the public catalog so patients can find and book them.
    if (data.user) await ensureDoctorRow(sb, data.user);
  }
  redirect("/doctor/dashboard");
}

export async function signOut() {
  if (isSupabaseConfigured) {
    const sb = await createServerSupabase();
    await sb.auth.signOut();
  }
  redirect("/");
}
