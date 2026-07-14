import { PatientShell } from "@/components/roleShells";
import { PageHeader } from "@/components/DashboardShell";
import { SettingsClient } from "@/components/SettingsClient";

export default function PatientSettings() {
  return (
    <PatientShell>
      <PageHeader title="Settings" subtitle="Notifications and account security." />
      <SettingsClient />
    </PatientShell>
  );
}
