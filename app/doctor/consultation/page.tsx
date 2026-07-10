import { redirect } from "next/navigation";

/* The old standalone consultation mockup had no realtime signaling, so a doctor
   landing here would sit in a dead room while the patient waited in the real
   shared room. The live consultation now always happens at
   /consultation/<appointmentId> — reached from the Requests list. Send anyone
   who hits this legacy URL to that list so they can Start the real room. */
export default function DoctorConsultationRedirect() {
  redirect("/doctor/appointments");
}
