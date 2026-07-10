import { redirect } from "next/navigation";

/* The old standalone consultation mockup had no realtime signaling, so a patient
   landing here would sit in a dead room while the doctor waited in the real
   shared room. The live consultation now always happens at
   /consultation/<appointmentId> — reached from the Appointments list. Send
   anyone who hits this legacy URL to that list so they can Join the real room. */
export default function PatientConsultationRedirect() {
  redirect("/patient/appointments");
}
