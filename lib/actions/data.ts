"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type Result = { ok: boolean };

/* Booking → create an appointment row for the signed-in patient. */
export async function createAppointment(input: {
  doctorId: string;
  doctorName: string;
  specialty: string;
  mode: string;
  date: string;
  time: string;
  fee: number;
  reason: string;
}): Promise<Result> {
  if (!isSupabaseConfigured) return { ok: true };
  try {
    const sb = await createServerSupabase();
    const {
      data: { user },
    } = await sb.auth.getUser();
    await sb.from("appointments").insert({
      doctor_id: input.doctorId,
      doctor_name: input.doctorName,
      specialty: input.specialty,
      patient_id: user?.id ?? null,
      patient_name: (user?.user_metadata?.full_name as string) || "You",
      date_label: input.date,
      time_label: input.time,
      mode: input.mode,
      status: "Upcoming",
      fee: input.fee,
      reason: input.reason || "General consultation",
    });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

/* Doctor accepts / declines a request. */
export async function updateAppointmentStatus(
  id: string,
  status: "Upcoming" | "Cancelled" | "Completed"
): Promise<Result> {
  if (!isSupabaseConfigured) return { ok: true };
  try {
    const sb = await createServerSupabase();
    await sb.from("appointments").update({ status }).eq("id", id);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

/* Doctor issues a prescription. */
export async function issuePrescription(input: {
  patientId?: string;
  doctorName: string;
  specialty: string;
  diagnosis: string;
  medicines: { name: string; dose: string; frequency: string; duration: string }[];
  tests: string[];
  notes: string;
}): Promise<Result> {
  if (!isSupabaseConfigured) return { ok: true };
  try {
    const sb = await createServerSupabase();
    await sb.from("prescriptions").insert({
      patient_id: input.patientId ?? null,
      doctor_name: input.doctorName,
      specialty: input.specialty,
      date_label: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      diagnosis: input.diagnosis,
      medicines: input.medicines,
      tests: input.tests,
      notes: input.notes,
    });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

/* Doctor saves weekly availability (upsert per day). */
export async function saveAvailability(
  doctorId: string,
  days: { day: string; enabled: boolean; slots: string[] }[]
): Promise<Result> {
  if (!isSupabaseConfigured) return { ok: true };
  try {
    const sb = await createServerSupabase();
    await sb.from("availability").upsert(
      days.map((d) => ({ doctor_id: doctorId, day: d.day, enabled: d.enabled, slots: d.slots })),
      { onConflict: "doctor_id,day" }
    );
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

/* Admin approves / rejects a verification submission. */
export async function decideVerification(
  id: string,
  status: "approved" | "rejected"
): Promise<Result> {
  if (!isSupabaseConfigured) return { ok: true };
  try {
    const sb = await createServerSupabase();
    await sb.from("verification_queue").update({ status }).eq("id", id);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
