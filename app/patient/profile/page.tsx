import { PatientShell } from "@/components/roleShells";
import { PageHeader } from "@/components/DashboardShell";
import { ProfileForm } from "@/components/ProfileForm";
import { getMyProfile, type Profile } from "@/lib/auth";

const demo: Profile = {
  full_name: "Alex Morgan",
  email: "alex.morgan@example.com",
  phone: "",
  dob: "",
  gender: "",
  role: "patient",
};

export default async function PatientProfile() {
  const profile = (await getMyProfile()) ?? demo;
  return (
    <PatientShell>
      <PageHeader title="Profile" subtitle="Manage your personal information." />
      <ProfileForm initial={profile} />
    </PatientShell>
  );
}
