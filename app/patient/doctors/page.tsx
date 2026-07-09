import { Suspense } from "react";
import { PatientShell } from "@/components/roleShells";
import { DoctorSearchClient } from "@/components/DoctorSearchClient";
import { getDoctors, getSpecialties } from "@/lib/db";

export default async function DoctorsPage() {
  const [doctors, specialties] = await Promise.all([getDoctors(), getSpecialties()]);
  return (
    <Suspense
      fallback={
        <PatientShell>
          <p className="text-mute">Loading doctors…</p>
        </PatientShell>
      }
    >
      <PatientShell>
        <DoctorSearchClient doctors={doctors} specialties={specialties} />
      </PatientShell>
    </Suspense>
  );
}
