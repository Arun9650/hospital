import { DoctorShell } from "@/components/roleShells";
import { PageHeader } from "@/components/DashboardShell";
import { ProfileForm } from "@/components/ProfileForm";
import { getMyProfile, type Profile } from "@/lib/auth";

const demo: Profile = {
  full_name: "Dr. Anaya Rao",
  email: "anaya.rao@example.com",
  phone: "",
  dob: "",
  gender: "",
  role: "doctor",
};

export default async function DoctorProfile() {
  const profile = (await getMyProfile()) ?? demo;
  return (
    <DoctorShell>
      <PageHeader title="Profile" subtitle="Manage your personal information." />
      <ProfileForm initial={profile} />
    </DoctorShell>
  );
}
