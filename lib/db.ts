/* -------------------------------------------------------------------------
   Single data-access layer for the whole app.

   Every read tries Supabase and FALLS BACK to mock data (lib/data.ts) when
   Supabase is unconfigured OR a query throws. That keeps the build green with
   placeholder keys and makes a misconfiguration non-fatal.
   ---------------------------------------------------------------------- */

import { isSupabaseConfigured } from "./supabase/config";
import { createPublicClient } from "./supabase/public";
import * as mock from "./data";
import type {
  Doctor,
  Specialty,
  Review,
  Appointment,
  Prescription,
  MedicalRecord,
  NotificationItem,
} from "./data";

/* ---- Row mappers (snake_case DB → camelCase types) -------------------- */

type Row = Record<string, unknown>;

function mapDoctor(r: Row): Doctor {
  return {
    id: String(r.id),
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
  };
}

function mapNotification(r: Row): NotificationItem {
  return {
    id: String(r.id),
    title: String(r.title ?? ""),
    body: String(r.body ?? ""),
    time: String(r.time_label ?? ""),
    kind: (r.kind as NotificationItem["kind"]) ?? "system",
    unread: Boolean(r.unread),
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
    const sb = createPublicClient();
    const filter = userId
      ? `patient_id.eq.${userId},patient_name.eq.You`
      : `patient_name.eq.You`;
    const { data, error } = await sb
      .from("appointments")
      .select("*")
      .or(filter)
      .order("created_at", { ascending: false });
    if (error || !data?.length) return mock.appointments;
    return data.map(mapAppointment);
  } catch {
    return mock.appointments;
  }
}

/** Incoming requests for a doctor (everything not the demo "You" patient). */
export async function getDoctorAppointments(doctorId: string): Promise<Appointment[]> {
  if (!isSupabaseConfigured) return mock.appointmentRequests;
  try {
    const sb = createPublicClient();
    const { data, error } = await sb
      .from("appointments")
      .select("*")
      .eq("doctor_id", doctorId)
      .neq("patient_name", "You");
    if (error || !data?.length) return mock.appointmentRequests;
    return data.map(mapAppointment);
  } catch {
    return mock.appointmentRequests;
  }
}

export async function getPrescriptions(userId?: string): Promise<Prescription[]> {
  if (!isSupabaseConfigured) return mock.prescriptions;
  try {
    const sb = createPublicClient();
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
    const sb = createPublicClient();
    const filter = userId ? `patient_id.eq.${userId},patient_id.is.null` : `patient_id.is.null`;
    const { data, error } = await sb.from("medical_records").select("*").or(filter);
    if (error || !data?.length) return mock.medicalRecords;
    return data.map(mapRecord);
  } catch {
    return mock.medicalRecords;
  }
}

export async function getNotifications(userId?: string): Promise<NotificationItem[]> {
  if (!isSupabaseConfigured) return mock.notifications;
  try {
    const sb = createPublicClient();
    const filter = userId ? `user_id.eq.${userId},user_id.is.null` : `user_id.is.null`;
    const { data, error } = await sb.from("notifications").select("*").or(filter);
    if (error || !data?.length) return mock.notifications;
    return data.map(mapNotification);
  } catch {
    return mock.notifications;
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
    const sb = createPublicClient();
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
    const sb = createPublicClient();
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
    const sb = createPublicClient();
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
