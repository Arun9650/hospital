import { AdminShell } from "@/components/roleShells";
import { PageHeader } from "@/components/DashboardShell";
import { SettingsClient } from "@/components/SettingsClient";

export default function AdminSettings() {
  return (
    <AdminShell>
      <PageHeader title="Settings" subtitle="Notifications and account security." />
      <SettingsClient />
    </AdminShell>
  );
}
