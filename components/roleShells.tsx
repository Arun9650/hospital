import { ReactNode } from "react";
import { DashboardShell } from "./DashboardShell";
import { patientNav, doctorNav, adminNav } from "./navConfigs";

export function PatientShell({ children }: { children: ReactNode }) {
  return (
    <DashboardShell
      role="Patient"
      nav={patientNav}
      user={{ name: "Alex Morgan", initials: "AM", color: "#0070d1", sub: "Patient" }}
    >
      {children}
    </DashboardShell>
  );
}

export function DoctorShell({ children }: { children: ReactNode }) {
  return (
    <DashboardShell
      role="Doctor"
      nav={doctorNav}
      user={{ name: "Dr. Anaya Rao", initials: "AR", color: "#0070d1", sub: "Cardiology" }}
    >
      {children}
    </DashboardShell>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <DashboardShell
      role="Admin"
      nav={adminNav}
      user={{ name: "Jordan Blake", initials: "JB", color: "#1f6f5c", sub: "Administrator" }}
    >
      {children}
    </DashboardShell>
  );
}
