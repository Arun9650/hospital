"use server";

import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

function initialsFrom(name: string, email: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  if (parts.length === 1 && parts[0]) return parts[0].slice(0, 2).toUpperCase();
  return (email.slice(0, 2) || "AH").toUpperCase();
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (isSupabaseConfigured) {
    const sb = await createServerSupabase();
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }
  redirect("/patient/dashboard");
}

export async function signUpPatient(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();

  if (isSupabaseConfigured) {
    const sb = await createServerSupabase();
    const { error } = await sb.auth.signUp({
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
  }
  redirect("/patient/dashboard");
}

export async function signUpDoctor(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();

  if (isSupabaseConfigured) {
    const sb = await createServerSupabase();
    const { error } = await sb.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: "doctor",
          initials: initialsFrom(fullName, email),
          avatar_color: "#0070d1",
        },
      },
    });
    if (error) redirect(`/doctor/register?error=${encodeURIComponent(error.message)}`);
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
