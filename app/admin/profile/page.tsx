import { AdminShell } from "@/components/roleShells";
import { PageHeader } from "@/components/DashboardShell";
import { ProfileForm } from "@/components/ProfileForm";
import { getMyProfile, type Profile } from "@/lib/auth";

const demo: Profile = {
  full_name: "Jordan Blake",
  email: "jordan.blake@example.com",
  phone: "",
  dob: "",
  gender: "",
  role: "admin",
};

export default async function AdminProfile() {
  const profile = (await getMyProfile()) ?? demo;
  return (
    <AdminShell>
      <PageHeader title="Profile" subtitle="Manage your personal information." />
      <ProfileForm initial={profile} />
    </AdminShell>
  );
}
