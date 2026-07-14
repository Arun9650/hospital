/* -------------------------------------------------------------------------
   Single data-access layer for the whole app.

   Every read tries Supabase and FALLS BACK to mock data (lib/data.ts) when
   Supabase is unconfigured OR a query throws. That keeps the build green with
   placeholder keys and makes a misconfiguration non-fatal.
   ---------------------------------------------------------------------- */

import { isSupabaseConfigured } from "./supabase/config";
import { createPublicClient } from "./supabase/public";
import { createServerSupabase } from "./supabase/server";
import { getUserId } from "./auth";
import { relativeTime, shortTime } from "./time";
import * as mock from "./data";
import type {
  Doctor,
  Specialty,
  Review,
  Appointment,
  Prescription,
  MedicalRecord,
  NotificationItem,
  ChatThread,
  ChatMessage,
  Patient,
} from "./data";

/** Demo patient name used for seeded (NULL-patient) chat threads. */
const DEMO_PATIENT_NAME = "Alex Morgan";

/* ---- Row mappers (snake_case DB → camelCase types) -------------------- */

type Row = Record<string, unknown>;

function mapDoctor(r: Row): Doctor {
  return {
    id: String(r.id),
    profile_id: String(r.profile_id ?? ""),
    name: String(r.name),
    specialty: String(r.specialty),
    specialtySlug: String(r.specialty_slug ?? ""),
    qualifications: String(r.qualifications ?? ""),
    experience: Number(r.experience ?? 0),
    rating: Number(r.rating ?? 0),
    reviews: Number(r.reviews ?? 0),
    fee: Number(r.fee ?? 0),
    location: String(r.location ?? ""),
    languages: (r.languages as string[]) ?? [],
    photo: String(r.photo ?? "#0070d1"),
    initials: String(r.initials ?? "DR"),
    verified: Boolean(r.verified),
    nextSlot: String(r.next_slot ?? ""),
    modes: (r.modes as Doctor["modes"]) ?? [],
    about: String(r.about ?? ""),
    tags: (r.tags as string[]) ?? [],
  };
}

function mapReview(r: Row): Review {
  return {
    id: String(r.id),
    patient: String(r.patient ?? ""),
    initials: String(r.initials ?? ""),
    rating: Number(r.rating ?? 5),
    date: String(r.date_label ?? ""),
    body: String(r.body ?? ""),
    doctorId: (r.doctor_id as string) ?? undefined,
  };
}

function mapAppointment(r: Row): Appointment {
  return {
    id: String(r.id),
    doctorId: String(r.doctor_id ?? ""),
    doctorName: String(r.doctor_name ?? ""),
    specialty: String(r.specialty ?? ""),
    patientName: String(r.patient_name ?? ""),
    date: String(r.date_label ?? ""),
    time: String(r.time_label ?? ""),
    mode: (r.mode as Appointment["mode"]) ?? "Video",
    status: (r.status as Appointment["status"]) ?? "Pending",
    fee: Number(r.fee ?? 0),
    reason: String(r.reason ?? ""),
  };
}

function mapPrescription(r: Row): Prescription {
  return {
    id: String(r.id),
    doctorName: String(r.doctor_name ?? ""),
    specialty: String(r.specialty ?? ""),
    date: String(r.date_label ?? ""),
    diagnosis: String(r.diagnosis ?? ""),
    medicines: (r.medicines as Prescription["medicines"]) ?? [],
    tests: (r.tests as string[]) ?? [],
    notes: String(r.notes ?? ""),
  };
}

function mapRecord(r: Row): MedicalRecord {
  return {
    id: String(r.id),
    title: String(r.title ?? ""),
    type: (r.type as MedicalRecord["type"]) ?? "Lab Report",
    date: String(r.date_label ?? ""),
    by: String(r.issued_by ?? ""),
    size: String(r.size ?? ""),
    url: r.file_url ? String(r.file_url) : undefined,
  };
}

/* ---- Doctor's patient panel — derived live from their appointments -------- */

const PATIENT_COLORS = [
  "#0070d1", "#1f6f5c", "#7a4bd1", "#c25b2e", "#2e7cc2",
  "#b03a6a", "#3a8f7a", "#5b6bd1", "#c28b2e", "#2eb0a0",
];

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (name.trim().slice(0, 2) || "PT").toUpperCase();
}

function ageFromDob(dob: unknown): number {
  if (!dob) return 0;
  const d = new Date(String(dob));
  if (isNaN(d.getTime())) return 0;
  const years = Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000));
  return years > 0 && years < 150 ? years : 0;
}

/* Roll a doctor's appointment rows up into one record per patient. Vitals
   (blood group / allergies / height / weight) aren't captured anywhere yet, so
   they show as placeholders; everything else is real. */
function buildPatientsFromAppointments(rows: Row[], doctorId: string): Patient[] {
  const groups = new Map<string, Row[]>();
  for (const r of rows) {
    const key = String(r.patient_id ?? r.patient_name ?? "unknown");
    const list = groups.get(key) ?? [];
    list.push(r);
    groups.set(key, list);
  }

  let i = 0;
  const out: Patient[] = [];
  for (const [key, appts] of groups) {
    const latest = appts[0]; // rows arrive newest-first
    const profile = (latest.patient as Row) ?? {};
    const name = String(profile.full_name || latest.patient_name || "Patient");
    out.push({
      id: key,
      doctorId,
      name,
      initials: String(profile.initials || initialsFromName(name)),
      age: ageFromDob(profile.dob),
      gender: String(profile.gender ?? ""),
      condition: String(latest.reason || "General consultation"),
      visits: appts.length,
      lastVisit: String(latest.date_label ?? ""),
      bloodGroup: "—",
      allergies: "Not recorded",
      height: "—",
      weight: "—",
      color: String(profile.avatar_color || PATIENT_COLORS[i % PATIENT_COLORS.length]),
      history: appts.slice(0, 6).map((a) => ({
        date: String(a.date_label ?? ""),
        title: String(a.reason || "Consultation"),
        by: "You",
      })),
    });
    i++;
  }
  return out;
}

function mapNotification(r: Row): NotificationItem {
  const createdAt = r.created_at ? String(r.created_at) : undefined;
  return {
    id: String(r.id),
    title: String(r.title ?? ""),
    body: String(r.body ?? ""),
    // Prefer the real timestamp; fall back to the legacy time_label only when a
    // row predates the created_at column.
    time: createdAt ? relativeTime(createdAt) : String(r.time_label ?? ""),
    createdAt,
    kind: (r.kind as NotificationItem["kind"]) ?? "system",
    unread: Boolean(r.unread),
    appointmentId: r.appointment_id ? String(r.appointment_id) : undefined,
  };
}

// Time helpers moved to lib/time.ts (client-safe). Re-exported here so existing
// server imports (`@/lib/db`) keep working.
export { relativeTime, shortTime };

function mapChatThread(t: Row, msgs: Row[], perspective: "patient" | "doctor"): ChatThread {
  const doc = (t.doctor as Row) ?? {};
  const messages: ChatMessage[] = msgs.map((m) => ({
    id: String(m.id),
    from: (m.sender as "patient" | "doctor") ?? "doctor",
    text: String(m.body ?? ""),
    time: shortTime(m.created_at),
  }));
  // Unread = trailing run of messages from the other party.
  const otherSide = perspective === "patient" ? "doctor" : "patient";
  let unread = 0;
  for (let i = messages.length - 1; i >= 0 && messages[i].from === otherSide; i--) unread++;
  const lastTs = msgs.length ? msgs[msgs.length - 1].created_at : (t.updated_at ?? t.created_at);
  return {
    id: String(t.id),
    doctorId: String(t.doctor_id ?? ""),
    doctorName: String(doc.name ?? "Doctor"),
    doctorInitials: String(doc.initials ?? "DR"),
    doctorColor: String(doc.photo ?? "#0070d1"),
    specialty: String(doc.specialty ?? ""),
    patientName: String(t.patient_name ?? "Patient"),
    patientInitials: String(t.patient_initials ?? "P"),
    patientColor: String(t.patient_color ?? "#0070d1"),
    online: Boolean(t.online),
    lastActive: relativeTime(lastTs),
    unread,
    messages,
  };
}

function mapSpecialty(r: Row): Specialty {
  return {
    slug: String(r.slug),
    name: String(r.name),
    icon: String(r.icon ?? ""),
    doctors: Number(r.doctors_count ?? 0),
    blurb: String(r.blurb ?? ""),
  };
}

/* ---- Reads ------------------------------------------------------------ */

export async function getSpecialties(): Promise<Specialty[]> {
  if (!isSupabaseConfigured) return mock.specialties;
  try {
    const sb = createPublicClient();
    const { data, error } = await sb.from("specialties").select("*");
    if (error || !data?.length) return mock.specialties;
    return data.map(mapSpecialty);
  } catch {
    return mock.specialties;
  }
}

export async function getDoctors(): Promise<Doctor[]> {
  if (!isSupabaseConfigured) return mock.doctors;
  try {
    const sb = createPublicClient();
    const { data, error } = await sb.from("doctors").select("*").order("rating", { ascending: false });
    if (error || !data?.length) return mock.doctors;
    return data.map(mapDoctor);
  } catch {
    return mock.doctors;
  }
}

export async function getFeaturedDoctors(): Promise<Doctor[]> {
  return (await getDoctors()).slice(0, 4);
}

export async function getDoctor(id: string): Promise<Doctor | undefined> {
  if (!isSupabaseConfigured) return mock.getDoctor(id);
  try {
    const sb = createPublicClient();
    const { data, error } = await sb.from("doctors").select("*").eq("id", id).maybeSingle();
    if (error || !data) return mock.getDoctor(id);
    return mapDoctor(data);
  } catch {
    return mock.getDoctor(id);
  }
}

export async function getReviews(doctorId?: string): Promise<Review[]> {
  if (!isSupabaseConfigured)
    return doctorId ? mock.reviews.filter((r) => r.doctorId === doctorId) : mock.reviews;
  try {
    const sb = createPublicClient();
    let q = sb.from("reviews").select("*");
    if (doctorId) q = q.eq("doctor_id", doctorId);
    const { data, error } = await q;
    if (error || !data?.length)
      return doctorId ? mock.reviews.filter((r) => r.doctorId === doctorId) : mock.reviews;
    return data.map(mapReview);
  } catch {
    return doctorId ? mock.reviews.filter((r) => r.doctorId === doctorId) : mock.reviews;
  }
}

/** Patient's own appointments + seeded demo ("You") rows. */
export async function getPatientAppointments(userId?: string): Promise<Appointment[]> {
  if (!isSupabaseConfigured) return mock.appointments;
  try {
    const sb = await createServerSupabase();
    const { data, error } = await sb
  .from("appointments")
  .select("*")
  .eq("patient_id", userId)
  .order("created_at", { ascending: false });

if (error) throw error;

return (data ?? []).map(mapAppointment);
  } catch {
    return mock.appointments;
  }
}

/**
 * Resolve the catalog row for the currently signed-in doctor via their auth
 * `profile_id`. This is the single source of truth for "who is this doctor",
 * replacing the scattered hardcoded ids ("dr-anaya-rao") and the name-as-id bug
 * that made a real doctor see someone else's data.
 */
export async function getCurrentDoctor(): Promise<Doctor | undefined> {
  // Demo mode (no backend): mirror DoctorShell's stand-in doctor.
  if (!isSupabaseConfigured) return mock.doctors.find((d) => d.id === "dr-anaya-rao");
  const userId = await getUserId();
  if (!userId) return undefined;
  try {
    const sb = createPublicClient();
    const { data } = await sb.from("doctors").select("*").eq("profile_id", userId).maybeSingle();
    return data ? mapDoctor(data) : undefined;
  } catch {
    return undefined;
  }
}

export type AvailabilityDay = { day: string; enabled: boolean; slots: string[] };

/** A doctor's saved weekly availability. Empty array => nothing saved yet
 *  (the editor falls back to sensible defaults). */
export async function getDoctorAvailability(doctorId: string): Promise<AvailabilityDay[]> {
  if (!isSupabaseConfigured || !doctorId) return [];
  try {
    const sb = createPublicClient();
    const { data, error } = await sb
      .from("availability")
      .select("day, enabled, slots")
      .eq("doctor_id", doctorId);
    if (error || !data?.length) return [];
    return data.map((r) => ({
      day: String(r.day),
      enabled: Boolean(r.enabled),
      slots: Array.isArray(r.slots) ? (r.slots as string[]) : [],
    }));
  } catch {
    return [];
  }
}

/** Incoming requests for a doctor (everything not the demo "You" patient). */
export async function getDoctorAppointments(doctorId: string): Promise<Appointment[]> {
  if (!isSupabaseConfigured) return mock.appointmentRequests;
  try {
    const sb = await createServerSupabase();
    const { data, error } = await sb
      .from("appointments")
      .select("*")
      .eq("doctor_id", doctorId)
      .neq("patient_name", "You")
      .order("created_at", { ascending: false });
    if (error || !data?.length) return mock.appointmentRequests;
    return data.map(mapAppointment);
  } catch {
    return mock.appointmentRequests;
  }
}

/**
 * Patients on a doctor's panel — built live from the doctor's real appointments
 * (one record per distinct patient, newest visit first). No mock/seed data:
 * returns an empty list when the doctor has no appointments yet.
 */
export async function getDoctorPatients(doctorId: string): Promise<Patient[]> {
  if (!isSupabaseConfigured || !doctorId) return [];
  try {
    const sb = await createServerSupabase();
    const { data, error } = await sb
      .from("appointments")
      .select(
        "id, patient_id, patient_name, reason, date_label, created_at, patient:profiles(full_name, dob, gender, avatar_color, initials)"
      )
      .eq("doctor_id", doctorId)
      .order("created_at", { ascending: false });
    if (error || !data?.length) return [];
    return buildPatientsFromAppointments(data as Row[], doctorId);
  } catch {
    return [];
  }
}

export async function getPrescriptions(userId?: string): Promise<Prescription[]> {
  if (!isSupabaseConfigured) return mock.prescriptions;
  try {
    const sb = await createServerSupabase();
    const filter = userId ? `patient_id.eq.${userId},patient_id.is.null` : `patient_id.is.null`;
    const { data, error } = await sb
      .from("prescriptions")
      .select("*")
      .or(filter)
      .order("created_at", { ascending: false });
    if (error || !data?.length) return mock.prescriptions;
    return data.map(mapPrescription);
  } catch {
    return mock.prescriptions;
  }
}

export async function getMedicalRecords(userId?: string): Promise<MedicalRecord[]> {
  if (!isSupabaseConfigured) return mock.medicalRecords;
  try {
    const sb = await createServerSupabase();
    const filter = userId ? `patient_id.eq.${userId},patient_id.is.null` : `patient_id.is.null`;
    const { data, error } = await sb.from("medical_records").select("*").or(filter);
    if (error || !data?.length) return mock.medicalRecords;

    // The medical-records bucket is private (0011): mint short-lived signed URLs
    // per read from the stored file_path so View/Download work under RLS.
    const rows = data as Row[];
    const paths = rows.map((r) => r.file_path).filter(Boolean) as string[];
    const signed = new Map<string, string>();
    if (paths.length) {
      const { data: urls } = await sb.storage
        .from("medical-records")
        .createSignedUrls(paths, 3600);
      for (const u of urls ?? []) {
        if (u.path && u.signedUrl) signed.set(u.path, u.signedUrl);
      }
    }
    return rows.map((r) => {
      const rec = mapRecord(r);
      const path = r.file_path ? String(r.file_path) : "";
      return { ...rec, url: path ? signed.get(path) : undefined };
    });
  } catch {
    return mock.medicalRecords;
  }
}

/**
 * Read notifications matching `filter`, newest first. Returns null on a hard
 * query error (caller then uses mock data). If ordering by `created_at` fails —
 * e.g. migration 0004 hasn't been applied and the column doesn't exist yet — we
 * retry unordered so real notifications aren't hidden behind a missing column.
 */
async function fetchNotifications(filter: string): Promise<NotificationItem[] | null> {
  const sb = await createServerSupabase();
  let res = await sb
    .from("notifications")
    .select("*")
    .or(filter)
    .order("created_at", { ascending: false });
  if (res.error) {
    // created_at may be missing (migration 0004 not applied) — retry unordered.
    res = await sb.from("notifications").select("*").or(filter);
  }
  if (res.error) return null;

  // Guarantee newest-first (current on top, older at the bottom) even on the
  // unordered fallback path. ISO timestamps sort lexicographically, so a string
  // compare is enough; rows without a created_at keep their relative order.
  const rows = ((res.data ?? []) as Row[])
    .slice()
    .sort((a, b) => String(b.created_at ?? "").localeCompare(String(a.created_at ?? "")));
  return rows.map(mapNotification);
}

export async function getNotifications(userId?: string): Promise<NotificationItem[]> {
  if (!isSupabaseConfigured) return mock.notifications;
  try {
    const filter = userId ? `user_id.eq.${userId},user_id.is.null` : `user_id.is.null`;
    const rows = await fetchNotifications(filter);
    if (!rows || rows.length === 0) return mock.notifications;
    return rows;
  } catch {
    return mock.notifications;
  }
}

/** Notifications for a signed-in doctor (their own + global demo rows). */
export async function getDoctorNotifications(profileId?: string): Promise<NotificationItem[]> {
  if (!isSupabaseConfigured) return mock.doctorNotifications;
  try {
    const filter = profileId ? `user_id.eq.${profileId},user_id.is.null` : `user_id.is.null`;
    const rows = await fetchNotifications(filter);
    if (!rows || rows.length === 0) return mock.doctorNotifications;
    return rows;
  } catch {
    return mock.doctorNotifications;
  }
}

/**
 * Chat threads for one side of the conversation.
 *  - "patient": the signed-in patient's own threads + seeded demo threads.
 *  - "doctor":  every thread addressed to the given doctor id.
 * Falls back to mock threads when Supabase is unconfigured or a query throws.
 */
export async function getChatThreads(
  perspective: "patient" | "doctor",
  opts: { userId?: string; doctorId?: string } = {}
): Promise<ChatThread[]> {
  const fallback =
    perspective === "patient" ? mock.patientChatThreads : mock.doctorChatThreads;
  if (!isSupabaseConfigured) return fallback;
  try {
    const sb = await createServerSupabase();
    let q = sb
      .from("chat_threads")
      .select("*, doctor:doctors(name, initials, photo, specialty)");
    if (perspective === "patient") {
      q = opts.userId
        ? q.or(`patient_id.eq.${opts.userId},patient_name.eq.${DEMO_PATIENT_NAME}`)
        : q.eq("patient_name", DEMO_PATIENT_NAME);
    } else if (opts.doctorId) {
      q = q.eq("doctor_id", opts.doctorId);
    }
    const { data: threads, error } = await q.order("updated_at", { ascending: false });
    if (error || !threads?.length) return fallback;

    const ids = threads.map((t) => t.id);
    const { data: msgs } = await sb
      .from("chat_messages")
      .select("*")
      .in("thread_id", ids)
      .order("created_at", { ascending: true });

    const byThread = new Map<string, Row[]>();
    for (const m of (msgs as Row[]) ?? []) {
      const key = String(m.thread_id);
      (byThread.get(key) ?? byThread.set(key, []).get(key)!).push(m);
    }
    return (threads as Row[]).map((t) =>
      mapChatThread(t, byThread.get(String(t.id)) ?? [], perspective)
    );
  } catch {
    return fallback;
  }
}

export async function getVerificationQueue() {
  if (!isSupabaseConfigured) return mock.verificationQueue;
  try {
    const sb = createPublicClient();
    const { data, error } = await sb.from("verification_queue").select("*");
    if (error || !data?.length) return mock.verificationQueue;
    return data.map((r: Row) => ({
      id: String(r.id),
      name: String(r.name),
      specialty: String(r.specialty),
      submitted: String(r.submitted),
      docs: Number(r.docs ?? 0),
      status: String(r.status),
    }));
  } catch {
    return mock.verificationQueue;
  }
}

export async function getAdminPatients() {
  if (!isSupabaseConfigured) return mock.adminPatients;
  try {
    const sb = await createServerSupabase();
    const { data, error } = await sb.from("profiles").select("*").eq("role", "patient");
    if (error || !data?.length) return mock.adminPatients;
    return data.map((r: Row) => ({
      id: String(r.id),
      name: String(r.full_name || "Patient"),
      email: String(r.email ?? ""),
      joined: new Date(String(r.created_at ?? Date.now())).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      }),
      appts: 0,
      status: "Active",
    }));
  } catch {
    return mock.adminPatients;
  }
}

export async function getAdminAppointments() {
  if (!isSupabaseConfigured) return mock.adminAppointments;
  try {
    const sb = await createServerSupabase();
    const { data, error } = await sb
      .from("appointments")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error || !data?.length) return mock.adminAppointments;
    return data.map((r: Row) => ({
      id: String(r.id).slice(0, 8),
      patient: String(r.patient_name ?? ""),
      doctor: String(r.doctor_name ?? ""),
      date: `${r.date_label ?? ""} ${r.time_label ?? ""}`.trim(),
      mode: String(r.mode ?? "Video"),
      status: String(r.status ?? "Pending"),
      fee: Number(r.fee ?? 0),
    }));
  } catch {
    return mock.adminAppointments;
  }
}

export async function getAdminStats() {
  if (!isSupabaseConfigured) return mock.adminStats;
  try {
    const sb = await createServerSupabase();
    const head = { count: "exact" as const, head: true };
    const [patients, doctors, appts, pending] = await Promise.all([
      sb.from("profiles").select("*", head).eq("role", "patient"),
      sb.from("doctors").select("*", head),
      sb.from("appointments").select("*", head),
      sb.from("verification_queue").select("*", head).eq("status", "Pending"),
    ]);
    return {
      ...mock.adminStats,
      patients: patients.count ?? mock.adminStats.patients,
      doctors: doctors.count ?? mock.adminStats.doctors,
      appointments: appts.count ?? mock.adminStats.appointments,
      pendingVerifications: pending.count ?? mock.adminStats.pendingVerifications,
    };
  } catch {
    return mock.adminStats;
  }
}
