"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createServerSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { firstError, isEmail, maxLen, minPassword, required } from "@/lib/validate";
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
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");
  const nextParam = next.startsWith("/") ? `&next=${encodeURIComponent(next)}` : "";

  // Server-side validation so an empty submit gives clear feedback rather than a
  // raw provider error.
  if (!email || !password) {
    redirect(`/login?error=${encodeURIComponent("Enter your email and password.")}${nextParam}`);
  }

  if (isSupabaseConfigured) {
    const sb = await createServerSupabase();
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) {
      const msg = error.message.toLowerCase();
      // "Email not confirmed" is the #1 lockout: surface it distinctly so the
      // login page can offer a one-click resend instead of a dead-end error.
      if (msg.includes("not confirmed") || msg.includes("confirm")) {
        redirect(`/login?error=unconfirmed&email=${encodeURIComponent(email)}${nextParam}`);
      }
      const friendly = msg.includes("invalid")
        ? "Incorrect email or password."
        : error.message;
      redirect(`/login?error=${encodeURIComponent(friendly)}${nextParam}`);
    }
    const role = (data.user?.user_metadata?.role as string) ?? "patient";
    // Backfill the catalog row for doctors (covers email-confirmed sign-ups and
    // accounts created before doctors were listed automatically).
    if (role === "doctor" && data.user) await ensureDoctorRow(sb, data.user);
    if (next.startsWith("/")) redirect(next);
    redirect(HOME_BY_ROLE[role] ?? "/patient/dashboard");
  }
  redirect(next.startsWith("/") ? next : "/patient/dashboard");
}

/* Re-send the sign-up confirmation email (for users stuck on "Email not
   confirmed"). No-op in mock mode. */
export async function resendConfirmation(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  if (isSupabaseConfigured && email) {
    const sb = await createServerSupabase();
    await sb.auth.resend({ type: "signup", email });
  }
  redirect(`/login?check_email=${encodeURIComponent(email)}`);
}

export async function signUpPatient(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();

  const invalid = firstError(isEmail(email), minPassword(password), required(fullName, "Full name"), maxLen(fullName, 100, "Full name"));
  if (invalid) redirect(`/register?error=${encodeURIComponent(invalid)}`);

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

  const invalid = firstError(isEmail(email), minPassword(password), required(fullName, "Full name"), maxLen(fullName, 100, "Full name"));
  if (invalid) redirect(`/doctor/register?error=${encodeURIComponent(invalid)}`);

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
    // Local scope: sign out only THIS device. The default ("global") revokes the
    // user's refresh tokens on every device, which would log them out of their
    // other phones/laptops too.
    await sb.auth.signOut({ scope: "local" });
  }
  redirect("/");
}

/* Send a password-reset email. The link routes through /auth/callback, which
   exchanges the code for a (recovery) session and lands the user on
   /reset-password. No-op in mock mode. */
export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  if (isSupabaseConfigured && email) {
    const sb = await createServerSupabase();
    const h = await headers();
    const origin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
    await sb.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?next=/reset-password`,
    });
  }
  // Always report "sent" — never reveal whether an account exists for that email.
  redirect(`/forgot-password?sent=${encodeURIComponent(email)}`);
}

/* Set a new password for the user in the current (recovery) session, then sign
   out so they log in fresh with it. No-op in mock mode. */
export async function updatePassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) {
    redirect(`/reset-password?error=${encodeURIComponent("Password must be at least 8 characters.")}`);
  }
  if (isSupabaseConfigured) {
    const sb = await createServerSupabase();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) {
      redirect(`/reset-password?error=${encodeURIComponent("Your reset link has expired. Request a new one.")}`);
    }
    const { error } = await sb.auth.updateUser({ password });
    if (error) redirect(`/reset-password?error=${encodeURIComponent(error.message)}`);
    await sb.auth.signOut({ scope: "local" });
  }
  redirect(`/login?reset=1`);
}
