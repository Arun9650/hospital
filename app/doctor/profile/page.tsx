import { DoctorShell } from "@/components/roleShells";
import { PageHeader } from "@/components/DashboardShell";
import { DoctorProfileForm } from "@/components/DoctorProfileForm";
import { getMyProfile, type Profile } from "@/lib/auth";
import { getCurrentDoctor } from "@/lib/db";
import { doctors as mockDoctors } from "@/lib/data";

const demoProfile: Profile = {
  full_name: "Dr. Anaya Rao",
  email: "anaya.rao@example.com",
  phone: "",
  dob: "",
  gender: "",
  role: "doctor",
};

export default async function DoctorProfile() {
  const [profile, doctor] = await Promise.all([getMyProfile(), getCurrentDoctor()]);
  return (
    <DoctorShell>
      <PageHeader title="Profile" subtitle="Manage your personal and professional details." />
      <DoctorProfileForm
        profile={profile ?? demoProfile}
        doctor={doctor ?? mockDoctors.find((d) => d.id === "dr-anaya-rao")!}
      />
    </DoctorShell>
  );
}
