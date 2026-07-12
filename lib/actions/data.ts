"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { shortTime } from "@/lib/db";
import { sendPushToUser } from "@/lib/push/send";

type Result = { ok: boolean };

type NotificationKind = "appointment" | "prescription" | "payment" | "system";

type ServerClient = Awaited<ReturnType<typeof createServerSupabase>>;

/* Insert one notification row. `userId` null => a global demo notification
   visible to everyone (used when a seed doctor has no linked auth profile). */
async function notify(
  sb: ServerClient,
  n: { userId?: string | null; title: string; body: string; kind: NotificationKind }
) {
  await sb.from("notifications").insert({
    id: crypto.randomUUID(),
    user_id: n.userId ?? null,
    title: n.title,
    body: n.body,
    time_label: "Just now",
    kind: n.kind,
    unread: true,
  });
}

/* General-purpose notification write, usable anywhere in the app. No-ops in
   mock mode. */
export async function createNotification(input: {
  userId?: string | null;
  title: string;
  body: string;
  kind: NotificationKind;
}): Promise<Result> {
  if (!isSupabaseConfigured) return { ok: true };
  try {
    const sb = await createServerSupabase();
    await notify(sb, input);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

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
}): Promise<Result & { id?: string }> {
  if (!isSupabaseConfigured) return { ok: true };
  try {
    const sb = await createServerSupabase();
    const {
      data: { user },
    } = await sb.auth.getUser();

    // Reuse an existing active booking for the same patient/doctor/slot instead
    // of piling up duplicates. Duplicate rows are indistinguishable, so the
    // patient and doctor can end up opening different /consultation/<id> rooms
    // and never meet. One slot = one appointment = one shared room.
    if (user?.id) {
      const { data: existing } = await sb
        .from("appointments")
        .select("id")
        .eq("patient_id", user.id)
        .eq("doctor_id", input.doctorId)
        .eq("date_label", input.date)
        .eq("time_label", input.time)
        .eq("status", "Upcoming")
        .limit(1)
        .maybeSingle();
      if (existing) return { ok: true, id: String(existing.id) };
    }

    const patientName = (user?.user_metadata?.full_name as string) || "You";
    const { data, error } = await sb
      .from("appointments")
      .insert({
        doctor_id: input.doctorId,
        doctor_name: input.doctorName,
        specialty: input.specialty,
        patient_id: user?.id ?? null,
        patient_name: patientName,
        date_label: input.date,
        time_label: input.time,
        mode: input.mode,
        status: "Upcoming",
        fee: input.fee,
        reason: input.reason || "General consultation",
      })
      .select("id")
      .single();
    if (error) return { ok: false };

    // Notify the doctor of the new booking. Route it to the doctor's auth
    // profile when they have one; otherwise leave it global (seed catalog
    // doctors have no linked account) so it still surfaces in the demo.
    const { data: doc } = await sb
      .from("doctors")
      .select("profile_id")
      .eq("id", input.doctorId)
      .maybeSingle();
    await notify(sb, {
      userId: (doc?.profile_id as string) ?? null,
      title: "New appointment request",
      body: `${patientName} booked a ${input.mode} consultation for ${input.date} at ${input.time}.`,
      kind: "appointment",
    });

    return { ok: true, id: String(data.id) };
  } catch {
    return { ok: false };
  }
}

/* Send a chat message. Returns the persisted row so the sender can render it
   immediately (realtime dedupes the echo by id). */
export async function sendChatMessage(input: {
  threadId: string;
  sender: "patient" | "doctor";
  body: string;
}): Promise<{ ok: boolean; id?: string; time?: string }> {
  const body = input.body.trim();
  if (!body) return { ok: false };
  if (!isSupabaseConfigured) return { ok: true };
  try {
    const sb = await createServerSupabase();
    const { data, error } = await sb
      .from("chat_messages")
      .insert({ thread_id: input.threadId, sender: input.sender, body })
      .select("id, created_at")
      .single();
    if (error || !data) return { ok: false };
    await sb
      .from("chat_threads")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", input.threadId);
    return { ok: true, id: String(data.id), time: shortTime(data.created_at) };
  } catch {
    return { ok: false };
  }
}

/* Find (or create) the patient's chat thread with a doctor, e.g. when the
   patient taps "Message doctor". Returns the thread id. */
export async function getOrCreatePatientThread(
  doctorId: string
): Promise<{ ok: boolean; threadId?: string }> {
  if (!isSupabaseConfigured) return { ok: true };
  try {
    const sb = await createServerSupabase();
    const {
      data: { user },
    } = await sb.auth.getUser();

    let find = sb.from("chat_threads").select("id").eq("doctor_id", doctorId);
    find = user
      ? find.or(`patient_id.eq.${user.id},patient_name.eq.Alex Morgan`)
      : find.eq("patient_name", "Alex Morgan");
    const { data: existing } = await find.limit(1).maybeSingle();
    if (existing) return { ok: true, threadId: String(existing.id) };

    if (!user) return { ok: false }; // anon can't create (RLS: authenticated only)
    const meta = user.user_metadata ?? {};
    const { data, error } = await sb
      .from("chat_threads")
      .insert({
        doctor_id: doctorId,
        patient_id: user.id,
        patient_name: (meta.full_name as string) || "You",
        patient_initials:
          (meta.initials as string) || (user.email ?? "AM").slice(0, 2).toUpperCase(),
        patient_color: (meta.avatar_color as string) || "#0070d1",
        online: true,
      })
      .select("id")
      .single();
    if (error || !data) return { ok: false };
    return { ok: true, threadId: String(data.id) };
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
    const { data: appt } = await sb
      .from("appointments")
      .update({ status })
      .eq("id", id)
      .select("patient_id, doctor_name")
      .maybeSingle();

    // Let the patient know the outcome of their request.
    if (appt?.patient_id && (status === "Upcoming" || status === "Cancelled")) {
      const confirmed = status === "Upcoming";
      const doctor = (appt.doctor_name as string) || "Your doctor";
      await notify(sb, {
        userId: appt.patient_id as string,
        title: confirmed ? "Appointment confirmed" : "Appointment declined",
        body: confirmed
          ? `${doctor} accepted your consultation request.`
          : `${doctor} is unavailable for the requested slot. Please pick another time.`,
        kind: "appointment",
      });
    }
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

    // Notify the patient that a new prescription is available.
    if (input.patientId) {
      await notify(sb, {
        userId: input.patientId,
        title: "New prescription available",
        body: `${input.doctorName} issued a digital prescription${
          input.diagnosis ? ` for ${input.diagnosis}` : ""
        }.`,
        kind: "prescription",
      });
    }
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
