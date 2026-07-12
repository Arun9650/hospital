import { NavItem } from "./DashboardShell";

/* Minimal line icons (stroke) shared across dashboard sidebars. */
function I({ d }: { d: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d={d} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const icons = {
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  search: "M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3",
  calendar: "M7 3v4M17 3v4M3 9h18M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z",
  file: "M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8zM14 3v5h5",
  rx: "M6 4h6a4 4 0 010 8H6zM6 12v8M10 15l7 7M17 15l-7 7",
  spark: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z",
  bell: "M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0",
  wallet: "M3 7h16a2 2 0 012 2v8a2 2 0 01-2 2H3zM3 7V5a2 2 0 012-2h12M17 13h.01",
  clock: "M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2",
  users: "M17 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9.5 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.9M16 3.1a4 4 0 010 7.8",
  shield: "M12 3l8 3v6c0 5-3.4 8-8 9-4.6-1-8-4-8-9V6z",
  chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  stethoscope: "M6 3v6a5 5 0 0010 0V3M4 3h4M16 3h4M19 14a3 3 0 100 6 3 3 0 000-6zM11 14v3a5 5 0 005 5",
  content: "M4 5h16M4 12h16M4 19h10",
  chat: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z",
};

export const patientNav: NavItem[] = [
  { href: "/patient/dashboard", label: "Dashboard", icon: <I d={icons.grid} /> },
  { href: "/patient/doctors", label: "Find Doctors", icon: <I d={icons.search} /> },
  { href: "/patient/messages", label: "Messages", icon: <I d={icons.chat} /> },
  { href: "/patient/appointments", label: "Appointments", icon: <I d={icons.calendar} /> },
  { href: "/patient/records", label: "Medical Records", icon: <I d={icons.file} /> },
  { href: "/patient/prescriptions", label: "Prescriptions", icon: <I d={icons.rx} /> },
  { href: "/patient/assistant", label: "AI Assistant", icon: <I d={icons.spark} /> },
  { href: "/patient/notifications", label: "Notifications", icon: <I d={icons.bell} /> },
];

export const doctorNav: NavItem[] = [
  { href: "/doctor/dashboard", label: "Dashboard", icon: <I d={icons.grid} /> },
  { href: "/doctor/appointments", label: "Requests", icon: <I d={icons.calendar} /> },
  { href: "/doctor/messages", label: "Messages", icon: <I d={icons.chat} /> },
  { href: "/doctor/appointments", label: "Consultation", icon: <I d={icons.stethoscope} /> },
  { href: "/doctor/patients", label: "Patient Records", icon: <I d={icons.users} /> },
  { href: "/doctor/prescriptions", label: "Prescriptions", icon: <I d={icons.rx} /> },
  { href: "/doctor/earnings", label: "Earnings", icon: <I d={icons.wallet} /> },
  { href: "/doctor/availability", label: "Availability", icon: <I d={icons.clock} /> },
  { href: "/doctor/notifications", label: "Notifications", icon: <I d={icons.bell} /> },
];

export const adminNav: NavItem[] = [
  { href: "/admin/dashboard", label: "Overview", icon: <I d={icons.grid} /> },
  { href: "/admin/patients", label: "Patients", icon: <I d={icons.users} /> },
  { href: "/admin/doctors", label: "Doctors", icon: <I d={icons.stethoscope} /> },
  { href: "/admin/appointments", label: "Appointments", icon: <I d={icons.calendar} /> },
  { href: "/admin/revenue", label: "Revenue", icon: <I d={icons.chart} /> },
  { href: "/admin/verification", label: "Verification", icon: <I d={icons.shield} /> },
  { href: "/admin/reports", label: "Reports", icon: <I d={icons.file} /> },
  { href: "/admin/content", label: "Content", icon: <I d={icons.content} /> },
  { href: "/admin/notifications", label: "Notifications", icon: <I d={icons.bell} /> },
];
