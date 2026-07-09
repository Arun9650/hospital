"use client";

import { ReactNode } from "react";
import { DashboardShell } from "./DashboardShell";
import { patientNav, doctorNav, adminNav } from "./navConfigs";
import { useSessionUser } from "./SessionProvider";

export function PatientShell({ children }: { children: ReactNode }) {
  const session = useSessionUser();
  const user = session
    ? { name: session.name, initials: session.initials, color: session.color, sub: "Patient" }
    : { name: "Alex Morgan", initials: "AM", color: "#0070d1", sub: "Patient" };
  return (
    <DashboardShell role="Patient" nav={patientNav} user={user}>
      {children}
    </DashboardShell>
  );
}

export function DoctorShell({ children }: { children: ReactNode }) {
  const session = useSessionUser();
  const user = session
    ? { name: session.name, initials: session.initials, color: session.color, sub: "Doctor" }
    : { name: "Dr. Anaya Rao", initials: "AR", color: "#0070d1", sub: "Cardiology" };
  return (
    <DashboardShell role="Doctor" nav={doctorNav} user={user}>
      {children}
    </DashboardShell>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const session = useSessionUser();
  const user = session
    ? { name: session.name, initials: session.initials, color: session.color, sub: "Administrator" }
    : { name: "Jordan Blake", initials: "JB", color: "#1f6f5c", sub: "Administrator" };
  return (
    <DashboardShell role="Admin" nav={adminNav} user={user}>
      {children}
    </DashboardShell>
  );
}
