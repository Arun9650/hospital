/* -------------------------------------------------------------------------
   Single data-access layer for the whole app.

   Every read tries Supabase and FALLS BACK to mock data (lib/data.ts) when
   Supabase is unconfigured OR a query throws. That keeps the build green with
   placeholder keys and makes a misconfiguration non-fatal.
   ---------------------------------------------------------------------- */

import { unstable_cache } from "next/cache";
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
  AuditEntry,
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

export const CHAT_PAGE_SIZE = 50;

/* Map one chat_messages row → ChatMessage, resolving a signed attachment URL
   from the supplied path→url map (private bucket, minted per read). */
export function mapChatMessage(m: Row, signedUrls?: Map<string, string>): ChatMessage {
  const path = m.attachment_path ? String(m.attachment_path) : "";
  return {
    id: String(m.id),
    from: (m.sender as "patient" | "doctor") ?? "doctor",
    text: String(m.body ?? ""),
    time: shortTime(m.created_at),
    createdAt: String(m.created_at ?? ""),
    readAt: m.read_at ? String(m.read_at) : null,
    attachmentUrl: path ? signedUrls?.get(path) : undefined,
    attachmentName: m.attachment_name ? String(m.attachment_name) : undefined,
    attachmentType: m.attachment_type ? String(m.attachment_type) : undefined,
  };
}

/* Batch-mint short-lived signed URLs for every attachment path in `rows`
   (chat-attachments is a private bucket). Returns path → url. */
export async function signChatAttachmentUrls(
  sb: Awaited<ReturnType<typeof createServerSupabase>>,
  rows: Row[]
): Promise<Map<string, string>> {
  const paths = rows.map((r) => r.attachment_path).filter(Boolean) as string[];
  const signed = new Map<string, string>();
  if (!paths.length) return signed;
  const { data: urls } = await sb.storage.from("chat-attachments").createSignedUrls(paths, 3600);
  for (const u of urls ?? []) if (u.path && u.signedUrl) signed.set(u.path, u.signedUrl);
  return signed;
}

function mapChatThread(
  t: Row,
  msgs: Row[],
  perspective: "patient" | "doctor",
  signedUrls?: Map<string, string>
): ChatThread {
  const doc = (t.doctor as Row) ?? {};
  const messages: ChatMessage[] = msgs.map((m) => mapChatMessage(m, signedUrls));
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
    // A full page loaded means older messages likely exist (§5.3 pagination).
    hasMoreMessages: msgs.length >= CHAT_PAGE_SIZE,
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

/* Catalog reads (doctors, specialties, reviews) are public, cookie-free and
   rarely change, yet were re-queried on every page load. Cache them across
   requests with a short revalidate so browsing is near-instant and the DB isn't
   hit per navigation. Per-user reads (appointments, records, notifications) stay
   dynamic. ponytail: time-based revalidation only — a doctor/review edit shows
   within CATALOG_TTL; add revalidateTag("doctors"/"reviews") on those writes if
   instant propagation is ever needed. */
const CATALOG_TTL = 300; // seconds

const getSpecialtiesCached = unstable_cache(
  async (): Promise<Specialty[]> => {
    const sb = createPublicClient();
    const { data, error } = await sb.from("specialties").select("*");
    if (error) throw error; // don't cache transient failures
    if (!data?.length) return mock.specialties;
    return data.map(mapSpecialty);
  },
  ["catalog:specialties"],
  { revalidate: CATALOG_TTL, tags: ["specialties"] }
);

export async function getSpecialties(): Promise<Specialty[]> {
  if (!isSupabaseConfigured) return mock.specialties;
  try {
    return await getSpecialtiesCached();
  } catch {
    return mock.specialties;
  }
}

const getDoctorsCached = unstable_cache(
  async (): Promise<Doctor[]> => {
    const sb = createPublicClient();
    const { data, error } = await sb.from("doctors").select("*").order("rating", { ascending: false });
    if (error) throw error;
    if (!data?.length) return mock.doctors;
    return data.map(mapDoctor);
  },
  ["catalog:doctors"],
  { revalidate: CATALOG_TTL, tags: ["doctors"] }
);

export async function getDoctors(): Promise<Doctor[]> {
  if (!isSupabaseConfigured) return mock.doctors;
  try {
    return await getDoctorsCached();
  } catch {
    return mock.doctors;
  }
}

export async function getFeaturedDoctors(): Promise<Doctor[]> {
  return (await getDoctors()).slice(0, 4);
}

export type DoctorQuery = {
  q?: string;
  specialties?: string[];
  modes?: string[];
  maxFee?: number;
  minRating?: number;
  sort?: string;
  offset?: number;
  limit?: number;
};
export type DoctorPage = { doctors: Doctor[]; total: number };

export const DOCTOR_PAGE_SIZE = 9;

function sortDoctors(list: Doctor[], sort?: string): Doctor[] {
  const out = [...list];
  if (sort === "Lowest price") out.sort((a, b) => a.fee - b.fee);
  else if (sort === "Most experienced") out.sort((a, b) => b.experience - a.experience);
  else if (sort === "Soonest available") out.sort((a, b) => a.nextSlot.localeCompare(b.nextSlot));
  else out.sort((a, b) => b.rating - a.rating);
  return out;
}

// In-memory filter mirroring the SQL query below — used in mock mode and as the
// hard-error fallback so both paths return identical results.
function filterDoctorsInMemory(all: Doctor[], query: DoctorQuery): DoctorPage {
  const q = (query.q ?? "").trim().toLowerCase();
  const filtered = all.filter((d) => {
    const matchesQuery =
      !q ||
      d.name.toLowerCase().includes(q) ||
      d.specialty.toLowerCase().includes(q) ||
      d.tags.some((t) => t.toLowerCase().includes(q));
    const matchesSpec = !query.specialties?.length || query.specialties.includes(d.specialty);
    const matchesMode = !query.modes?.length || query.modes.some((m) => d.modes.includes(m as never));
    const matchesFee = query.maxFee == null || d.fee <= query.maxFee;
    const matchesRating = !query.minRating || d.rating >= query.minRating;
    return matchesQuery && matchesSpec && matchesMode && matchesFee && matchesRating;
  });
  const sorted = sortDoctors(filtered, query.sort);
  const offset = query.offset ?? 0;
  const limit = query.limit ?? DOCTOR_PAGE_SIZE;
  return { doctors: sorted.slice(offset, offset + limit), total: sorted.length };
}

/**
 * Server-side, paginated doctor search. Unlike getDoctors (which mock-falls-back
 * on empty), an empty *match set* is respected — "no doctors match" is a valid
 * result — and we only fall back to the mock catalog on a hard query error, so
 * the demo still works if the doctors table is unreachable.
 */
// Cached per distinct query (unstable_cache keys on the args): the hot cases —
// page 1 with no filter, per-specialty browse, pagination — become cache hits;
// unique text searches simply miss and re-query. Throws on hard error so only
// real result sets are cached; the outer searchDoctors falls back to mock.
const searchDoctorsCached = unstable_cache(
  async (query: DoctorQuery): Promise<DoctorPage> => {
    const offset = query.offset ?? 0;
    const limit = query.limit ?? DOCTOR_PAGE_SIZE;
    const sb = createPublicClient();
    let sel = sb.from("doctors").select("*", { count: "exact" });

    // Sanitize before interpolating into the PostgREST .or() string: strip the
    // characters that are significant to its filter grammar (and ilike wildcards)
    // so a crafted query can't inject extra filters (§5.2 .or()-injection audit).
    const safeQ = (query.q ?? "").replace(/[,()%*\\:]/g, " ").trim();
    if (safeQ) sel = sel.or(`name.ilike.%${safeQ}%,specialty.ilike.%${safeQ}%`);
    if (query.specialties?.length) sel = sel.in("specialty", query.specialties);
    if (query.modes?.length) sel = sel.overlaps("modes", query.modes);
    if (query.maxFee != null) sel = sel.lte("fee", query.maxFee);
    if (query.minRating) sel = sel.gte("rating", query.minRating);

    if (query.sort === "Lowest price") sel = sel.order("fee", { ascending: true });
    else if (query.sort === "Most experienced") sel = sel.order("experience", { ascending: false });
    else if (query.sort === "Soonest available") sel = sel.order("next_slot", { ascending: true });
    else sel = sel.order("rating", { ascending: false });

    const { data, error, count } = await sel.range(offset, offset + limit - 1);
    if (error) throw error;
    return { doctors: (data ?? []).map(mapDoctor), total: count ?? 0 };
  },
  ["catalog:search-doctors"],
  { revalidate: CATALOG_TTL, tags: ["doctors"] }
);

export async function searchDoctors(query: DoctorQuery): Promise<DoctorPage> {
  if (!isSupabaseConfigured) return filterDoctorsInMemory(mock.doctors, query);
  try {
    return await searchDoctorsCached(query);
  } catch {
    return filterDoctorsInMemory(mock.doctors, query);
  }
}

const getDoctorCached = unstable_cache(
  async (id: string): Promise<Doctor | null> => {
    const sb = createPublicClient();
    const { data, error } = await sb.from("doctors").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data ? mapDoctor(data) : null;
  },
  ["catalog:doctor"],
  { revalidate: CATALOG_TTL, tags: ["doctors"] }
);

export async function getDoctor(id: string): Promise<Doctor | undefined> {
  if (!isSupabaseConfigured) return mock.getDoctor(id);
  try {
    return (await getDoctorCached(id)) ?? mock.getDoctor(id);
  } catch {
    return mock.getDoctor(id);
  }
}

const getReviewsCached = unstable_cache(
  async (doctorId: string): Promise<Review[] | null> => {
    const sb = createPublicClient();
    let q = sb.from("reviews").select("*");
    if (doctorId) q = q.eq("doctor_id", doctorId);
    const { data, error } = await q;
    if (error) throw error;
    return data?.length ? data.map(mapReview) : null;
  },
  ["catalog:reviews"],
  { revalidate: CATALOG_TTL, tags: ["reviews"] }
);

export async function getReviews(doctorId?: string): Promise<Review[]> {
  const fallback = doctorId
    ? mock.reviews.filter((r) => r.doctorId === doctorId)
    : mock.reviews;
  if (!isSupabaseConfigured) return fallback;
  try {
    return (await getReviewsCached(doctorId ?? "")) ?? fallback;
  } catch {
    return fallback;
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

// The medical-records bucket is private (0011): mint short-lived signed URLs
// per read from each stored file_path so View/Download work under RLS.
async function withSignedRecordUrls(
  sb: Awaited<ReturnType<typeof createServerSupabase>>,
  rows: Row[]
): Promise<MedicalRecord[]> {
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
}

export async function getMedicalRecords(userId?: string): Promise<MedicalRecord[]> {
  if (!isSupabaseConfigured) return mock.medicalRecords;
  try {
    const sb = await createServerSupabase();
    const filter = userId ? `patient_id.eq.${userId},patient_id.is.null` : `patient_id.is.null`;
    const { data, error } = await sb.from("medical_records").select("*").or(filter);
    if (error || !data?.length) return mock.medicalRecords;
    return withSignedRecordUrls(sb, data as Row[]);
  } catch {
    return mock.medicalRecords;
  }
}

// Doctor-side: a treating doctor reads ONE patient's uploaded records. RLS (0015)
// gates this to their own patients. Unlike getMedicalRecords, empty means empty —
// no mock fallback and no null-owner demo rows — so the doctor sees exactly what
// that patient uploaded.
export async function getPatientMedicalRecords(patientId: string): Promise<MedicalRecord[]> {
  if (!isSupabaseConfigured || !patientId) return [];
  try {
    const sb = await createServerSupabase();
    const { data, error } = await sb
      .from("medical_records")
      .select("*")
      .eq("patient_id", patientId);
    if (error || !data?.length) return [];
    return withSignedRecordUrls(sb, data as Row[]);
  } catch {
    return [];
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

    // Load only the most-recent page per thread (one round trip via window RPC)
    // so a long history doesn't load in full; older messages page in on demand.
    const ids = threads.map((t) => t.id);
    const { data: msgs } = await sb.rpc("recent_chat_messages", {
      p_thread_ids: ids,
      p_limit: CHAT_PAGE_SIZE,
    });

    const byThread = new Map<string, Row[]>();
    for (const m of (msgs as Row[]) ?? []) {
      const key = String(m.thread_id);
      (byThread.get(key) ?? byThread.set(key, []).get(key)!).push(m);
    }
    // The RPC returns newest-first; mapChatThread expects ascending order.
    for (const list of byThread.values())
      list.sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
    const signed = await signChatAttachmentUrls(sb, (msgs as Row[]) ?? []);
    return (threads as Row[]).map((t) =>
      mapChatThread(t, byThread.get(String(t.id)) ?? [], perspective, signed)
    );
  } catch {
    return fallback;
  }
}

export async function getVerificationQueue() {
  if (!isSupabaseConfigured) return mock.verificationQueue;
  try {
    // Auth-aware client: verification_queue is admin-only under RLS (0014), so
    // the anon public client would read 0 rows and fall through to mock.
    const sb = await createServerSupabase();
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
    const [{ data, error }, { data: appts }] = await Promise.all([
      sb.from("profiles").select("*").eq("role", "patient").order("created_at", { ascending: false }),
      sb.from("appointments").select("patient_id"),
    ]);
    if (error || !data?.length) return mock.adminPatients;
    // Real appointment count per patient → drives the "Appointments" column and
    // an Active/Inactive status (has ever booked vs not).
    const counts = new Map<string, number>();
    for (const a of appts ?? []) {
      const k = String(a.patient_id ?? "");
      if (k) counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    return data.map((r: Row) => {
      const n = counts.get(String(r.id)) ?? 0;
      return {
        id: String(r.id),
        name: String(r.full_name || "Patient"),
        email: String(r.email ?? ""),
        joined: new Date(String(r.created_at ?? Date.now())).toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
        appts: n,
        status: n > 0 ? "Active" : "Inactive",
      };
    });
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
      .limit(200);
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

export type AuditPage = { entries: AuditEntry[]; total: number };

const AUDIT_PAGE_SIZE = 30;

function mapAuditEntry(r: Row): AuditEntry {
  const actor = (r.actor as Row) ?? {};
  const createdAt = r.created_at ? String(r.created_at) : undefined;
  return {
    id: String(r.id),
    actor: String(actor.full_name || "System"),
    actorRole: actor.role ? String(actor.role) : undefined,
    action: String(r.action ?? ""),
    target: [r.target_type, r.target_id].filter(Boolean).map(String).join(" · "),
    meta: (r.meta as Record<string, unknown>) ?? {},
    time: createdAt ? relativeTime(createdAt) : "",
    createdAt,
  };
}

/**
 * Admin audit trail, newest first, paginated. Admin-only under RLS (0016).
 * Empty means empty (no activity yet) — mock is used only in demo mode or on a
 * hard query error, so a real, quiet log doesn't show fabricated rows.
 */
export async function getAuditLog(offset = 0, limit = AUDIT_PAGE_SIZE): Promise<AuditPage> {
  const demo = (): AuditPage => ({
    entries: mock.auditLog.slice(offset, offset + limit),
    total: mock.auditLog.length,
  });
  if (!isSupabaseConfigured) return demo();
  try {
    const sb = await createServerSupabase();
    const { data, error, count } = await sb
      .from("audit_log")
      .select("*, actor:profiles(full_name, role)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) return demo();
    return { entries: (data ?? []).map(mapAuditEntry), total: count ?? 0 };
  } catch {
    return demo();
  }
}

export async function getAdminStats() {
  if (!isSupabaseConfigured) return mock.adminStats;
  try {
    const sb = await createServerSupabase();
    const head = { count: "exact" as const, head: true };
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const [patients, doctors, appts, pending, active, mtdFees] = await Promise.all([
      sb.from("profiles").select("*", head).eq("role", "patient"),
      sb.from("doctors").select("*", head),
      sb.from("appointments").select("*", head),
      // Pending = anything not yet decided (covers seeded "Pending"/"In review").
      sb.from("verification_queue").select("*", head).not("status", "in", '("approved","rejected")'),
      sb.from("appointments").select("*", head).eq("status", "Upcoming"),
      // Revenue (MTD): completed-consultation fees booked this calendar month.
      // date_label is free text, so created_at is the only real timestamp.
      sb.from("appointments").select("fee").eq("status", "Completed").gte("created_at", monthStart),
    ]);
    const revenue = (mtdFees.data ?? []).reduce((s, r) => s + Number((r as Row).fee ?? 0), 0);
    return {
      patients: patients.count ?? 0,
      doctors: doctors.count ?? 0,
      appointments: appts.count ?? 0,
      revenue,
      pendingVerifications: pending.count ?? 0,
      activeConsults: active.count ?? 0,
    };
  } catch {
    return mock.adminStats;
  }
}

/* Real marketplace revenue for the admin revenue page, aggregated in JS from
   completed appointments (PostgREST has no cheap SUM without an RPC).
   ponytail: fetches all completed fee rows — fine at demo scale; move the sum
   and group-by into a Postgres RPC/view if the appointments table grows large. */
export type AdminRevenue = {
  mtd: number;
  commission: number;
  payouts: number;
  avgOrderValue: number;
  byDay: { day: string; value: number }[];
  bySpecialty: { name: string; value: number }[];
};

// Sum an amount field into the last 7 calendar days, labelled by weekday.
function amountByRecentDay(rows: Row[], amountKey: string): { day: string; value: number }[] {
  const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const buckets = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    const start = d.getTime();
    return { day: names[d.getDay()], value: 0, start, end: start + 86400000 };
  });
  for (const r of rows) {
    const t = new Date(String(r.created_at)).getTime();
    const b = buckets.find((b) => t >= b.start && t < b.end);
    if (b) b.value += Number(r[amountKey] ?? 0);
  }
  return buckets.map(({ day, value }) => ({ day, value }));
}

export async function getAdminRevenue(): Promise<AdminRevenue> {
  const demo = (): AdminRevenue => ({
    mtd: mock.adminStats.revenue,
    commission: Math.round(mock.adminStats.revenue * 0.15),
    payouts: Math.round(mock.adminStats.revenue * 0.85),
    avgOrderValue: 43.6,
    byDay: mock.earnings.breakdown,
    bySpecialty: [],
  });
  if (!isSupabaseConfigured) return demo();
  try {
    const sb = await createServerSupabase();
    const { data, error } = await sb
      .from("appointments")
      .select("fee, specialty, created_at")
      .eq("status", "Completed");
    if (error) return demo();
    const rows = (data ?? []) as Row[];
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
    const mtdRows = rows.filter((r) => new Date(String(r.created_at)).getTime() >= monthStart);
    const mtd = mtdRows.reduce((s, r) => s + Number(r.fee ?? 0), 0);
    const total = rows.reduce((s, r) => s + Number(r.fee ?? 0), 0);
    const bySpec = new Map<string, number>();
    for (const r of rows) {
      const k = String(r.specialty || "Other");
      bySpec.set(k, (bySpec.get(k) ?? 0) + Number(r.fee ?? 0));
    }
    return {
      mtd,
      commission: Math.round(mtd * 0.15),
      payouts: Math.round(mtd * 0.85),
      avgOrderValue: rows.length ? Math.round((total / rows.length) * 100) / 100 : 0,
      byDay: amountByRecentDay(rows, "fee"),
      bySpecialty: [...bySpec.entries()]
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6),
    };
  } catch {
    return demo();
  }
}

/* Real doctor earnings, aggregated from that doctor's appointments. Time buckets
   use created_at (date_label is free text). Payouts have no source until the
   payments integration lands, so the earnings page shows an empty payouts state
   in live mode rather than fabricated rows. */
export type DoctorEarnings = {
  today: number;
  week: number;
  month: number;
  pending: number;
  consultations: number;
  breakdown: { day: string; value: number }[];
};

export async function getDoctorEarnings(doctorId: string): Promise<DoctorEarnings> {
  const demo = (): DoctorEarnings => ({
    today: mock.earnings.today,
    week: mock.earnings.week,
    month: mock.earnings.month,
    pending: mock.earnings.pending,
    consultations: mock.earnings.consultations,
    breakdown: mock.earnings.breakdown,
  });
  if (!isSupabaseConfigured || !doctorId) return demo();
  try {
    const sb = await createServerSupabase();
    const { data, error } = await sb
      .from("appointments")
      .select("fee, status, created_at")
      .eq("doctor_id", doctorId);
    if (error) return demo();
    const rows = (data ?? []) as Row[];
    const completed = rows.filter((r) => r.status === "Completed");
    const now = Date.now();
    const day = 86400000;
    const sumSince = (ms: number) =>
      completed
        .filter((r) => now - new Date(String(r.created_at)).getTime() < ms)
        .reduce((s, r) => s + Number(r.fee ?? 0), 0);
    return {
      today: sumSince(day),
      week: sumSince(7 * day),
      month: sumSince(30 * day),
      pending: rows.filter((r) => r.status === "Upcoming").reduce((s, r) => s + Number(r.fee ?? 0), 0),
      consultations: completed.length,
      breakdown: amountByRecentDay(completed, "fee"),
    };
  } catch {
    return demo();
  }
}
