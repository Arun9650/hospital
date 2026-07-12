"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { shortTime } from "@/lib/time";
import { sendPushToUser } from "@/lib/push/send";
import type { Prescription } from "@/lib/data";

type Result = { ok: boolean };

type NotificationKind = "appointment" | "prescription" | "payment" | "system";

type ServerClient = Awaited<ReturnType<typeof createServerSupabase>>;

/* Insert one notification row AND, when it targets a specific user, deliver it
   to their subscribed devices via Web Push. `userId` null => a global demo
   notification visible to everyone (used when a seed doctor has no linked auth
   profile); global rows can't be pushed since there's no device to target. */
async function notify(
  sb: ServerClient,
  n: {
    userId?: string | null;
    title: string;
    body: string;
    kind: NotificationKind;
    url?: string;
  }
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

  if (n.userId) {
    await sendPushToUser(n.userId, {
      title: n.title,
      body: n.body,
      url: n.url,
      tag: n.kind,
    });
  }
}

/* General-purpose notification write, usable anywhere in the app. No-ops in
   mock mode. */
export async function createNotification(input: {
  userId?: string | null;
  title: string;
  body: string;
  kind: NotificationKind;
  url?: string;
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

/* Mark notifications as read (records read_at + updated_at). With `ids`, marks
   just those; otherwise marks all of the current user's unread notifications
   (plus the global demo rows they can see). No-op in mock mode. */
export async function markNotificationsRead(ids?: string[]): Promise<Result> {
  if (!isSupabaseConfigured) return { ok: true };
  try {
    const sb = await createServerSupabase();
    const patch = { unread: false, read_at: new Date().toISOString() };
    if (ids?.length) {
      await sb.from("notifications").update(patch).in("id", ids);
    } else {
      const {
        data: { user },
      } = await sb.auth.getUser();
      const filter = user?.id ? `user_id.eq.${user.id},user_id.is.null` : `user_id.is.null`;
      await sb.from("notifications").update(patch).or(filter).eq("unread", true);
    }
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

/* Booking → atomically create the appointment AND the doctor's notification.
   Returns the appointment id on success, or a human-readable error. */
export async function createAppointment(input: {
  id: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  mode: string;
  date: string;
  time: string;
  fee: number;
  reason: string;
}): Promise<Result & { id?: string; error?: string }> {
  if (!isSupabaseConfigured) return { ok: true };
  try {
    const sb = await createServerSupabase();
    const {
      data: { user },
    } = await sb.auth.getUser();

    // A real booking requires an authenticated patient — never persist an
    // anonymous/orphan appointment.
    if (!user?.id) {
      console.warn("[booking] rejected: no authenticated patient (check session/cookies)");
      return { ok: false, error: "Please sign in to book an appointment." };
    }

    // Validate the payload before touching the database.
    if (!input.doctorId || !input.date || !input.time || !input.mode) {
      console.warn("[booking] rejected: missing fields", {
        doctorId: input.doctorId,
        date: input.date,
        time: input.time,
        mode: input.mode,
      });
      return { ok: false, error: "Missing appointment details. Pick a slot and try again." };
    }

    // Idempotency / duplicate-click guard: reuse an existing pending or upcoming
    // booking for the same patient/doctor/slot rather than creating a second one
    // (which would also fire a duplicate notification).
    const { data: existing } = await sb
      .from("appointments")
      .select("id")
      .eq("patient_id", user.id)
      .eq("doctor_id", input.doctorId)
      .eq("date_label", input.date)
      .eq("time_label", input.time)
      .in("status", ["Pending","Upcoming"])
      .limit(1)
      .maybeSingle();
    if (existing) {
      console.log(
        "[booking] reused existing appointment for this slot — NO new appointment or notification created",
        { appointmentId: String(existing.id), doctorId: input.doctorId, slot: `${input.date} ${input.time}` }
      );
      return { ok: true, id: String(existing.id) };
    }

    const meta = user.user_metadata ?? {};
    // Store the patient's real name so the appointment shows up in the doctor's
    // list. ("You" is reserved for the patient's own seeded demo rows, which the
    // doctor query filters out — using it here would hide the booking.)
    const patientName =
      (meta.full_name as string) ||
      (user.email ? user.email.split("@")[0] : "") ||
      "Patient";

    // Atomic: appointment + notification inserted in one Postgres transaction.
    // Either both persist or neither — no orphan notification — and the booking
    // is only reported "ok" once the appointment row is actually saved.
    const { data, error } = await sb.rpc("book_appointment", {
      p_doctor_id: input.doctorId,
      p_doctor_name: input.doctorName,
      p_specialty: input.specialty,
      p_patient_id: user.id,
      p_patient_name: patientName,
      p_date_label: input.date,
      p_time_label: input.time,
      p_mode: input.mode,
      p_fee: input.fee,
      p_reason: input.reason,
    });
    if (error) {
      // Surface the real Postgres/PostgREST cause so booking failures are
      // diagnosable from the server log. The most common one is PGRST202
      // "Could not find function public.book_appointment" → migration 0007 isn't
      // applied, or the API schema cache needs `notify pgrst, 'reload schema';`.
      console.error("[booking] book_appointment RPC failed", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      return { ok: false, error: "Couldn't save your appointment. Please try again." };
    }
    const row = Array.isArray(data) ? data[0] : data;
    if (!row?.appointment_id) {
      console.error("[booking] book_appointment returned no appointment id", { data });
      return { ok: false, error: "Couldn't save your appointment. Please try again." };
    }
    const appointmentId = String(row.appointment_id);
    console.log("[booking] appointment created", {
      appointmentId,
      doctorId: input.doctorId,
      patient: patientName,
    });

    // The in-app notification already streamed to the doctor via Realtime the
    // moment the transaction committed. Web Push is the only post-commit side
    // effect left, and it targets the doctor's linked account when they have one.
    console.log("sending push to doctor", input.doctorId, "for appointment", appointmentId);
    const { data: doc } = await sb
      .from("doctors")
      .select("profile_id")
      .eq("id", input.doctorId)
      .maybeSingle();
    if (doc?.profile_id) {
      await sendPushToUser(String(doc.profile_id), {
        title: "New appointment request",
        body: `${patientName} booked a ${input.mode} consultation for ${input.date} at ${input.time}.`,
        url: "/doctor/notifications",
        tag: "appointment",
      });
    }

    return { ok: true, id: appointmentId };
  } catch (err) {
    console.error("[booking] unexpected error", err);
    return { ok: false, error: "Something went wrong while booking. Please try again." };
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
        url: "/patient/notifications",
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
        url: "/patient/prescriptions",
      });
    }
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

/* Doctor issues a prescription DURING a consultation. Resolves the patient (and
   the doctor's name/specialty) from the appointment so the call room only needs
   to pass the appointment id + the clinical fields. Links the prescription to
   the appointment and notifies the patient. */
export async function issuePrescriptionForAppointment(
  appointmentId: string,
  input: {
    diagnosis: string;
    medicines: { name: string; dose: string; frequency: string; duration: string }[];
    tests: string[];
    notes: string;
  }
): Promise<Result & { prescription?: Prescription }> {
  if (!isSupabaseConfigured) return { ok: true };
  try {
    const sb = await createServerSupabase();
    const { data: appt } = await sb
      .from("appointments")
      .select("patient_id, doctor_name, specialty")
      .eq("id", appointmentId)
      .maybeSingle();
    if (!appt) {
      console.warn("[prescription] appointment not found", { appointmentId });
      return { ok: false };
    }

    const doctorName = (appt.doctor_name as string) || "Your doctor";
    const specialty = (appt.specialty as string) ?? "";
    const dateLabel = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const { data: row, error } = await sb
      .from("prescriptions")
      .insert({
        appointment_id: appointmentId,
        patient_id: (appt.patient_id as string) ?? null,
        doctor_name: doctorName,
        specialty,
        date_label: dateLabel,
        diagnosis: input.diagnosis,
        medicines: input.medicines,
        tests: input.tests,
        notes: input.notes,
      })
      .select("id")
      .single();
    if (error) {
      console.error("[prescription] insert failed", { message: error.message, code: error.code });
      return { ok: false };
    }

    if (appt.patient_id) {
      await notify(sb, {
        userId: appt.patient_id as string,
        title: "New prescription available",
        body: `${doctorName} issued a prescription${
          input.diagnosis ? ` for ${input.diagnosis}` : ""
        }.`,
        kind: "prescription",
        url: "/patient/prescriptions",
      });
    }
    // Hand the saved prescription back so the caller (the in-call pad) can drop a
    // downloadable copy straight into the consultation chat.
    return {
      ok: true,
      prescription: {
        id: String(row?.id ?? `rx-${Date.now()}`),
        doctorName,
        specialty,
        date: dateLabel,
        diagnosis: input.diagnosis,
        medicines: input.medicines,
        tests: input.tests,
        notes: input.notes,
      },
    };
  } catch (err) {
    console.error("[prescription] unexpected error", err);
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
