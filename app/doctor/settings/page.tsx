import { DoctorShell } from "@/components/roleShells";
import { PageHeader } from "@/components/DashboardShell";
import { SettingsClient } from "@/components/SettingsClient";

export default function DoctorSettings() {
  return (
    <DoctorShell>
      <PageHeader title="Settings" subtitle="Notifications and account security." />
      <SettingsClient />
    </DoctorShell>
  );
}
