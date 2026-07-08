import Link from "next/link";

const columns = [
  {
    title: "Patients",
    links: [
      { label: "Find a doctor", href: "/patient/doctors" },
      { label: "Book appointment", href: "/patient/doctors" },
      { label: "Health records", href: "/patient/records" },
      { label: "AI assistant", href: "/patient/assistant" },
    ],
  },
  {
    title: "Doctors",
    links: [
      { label: "Join as a doctor", href: "/doctor/register" },
      { label: "Doctor dashboard", href: "/doctor/dashboard" },
      { label: "Earnings", href: "/doctor/earnings" },
      { label: "Availability", href: "/doctor/availability" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About us", href: "/#" },
      { label: "Careers", href: "/#" },
      { label: "Admin console", href: "/admin/dashboard" },
      { label: "Contact", href: "/#" },
    ],
  },
  {
    title: "Trust",
    links: [
      { label: "Privacy", href: "/#" },
      { label: "Security", href: "/#" },
      { label: "Terms", href: "/#" },
      { label: "Help center", href: "/#" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-ps text-white">
      <div className="container-x py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 21s-7-4.35-7-10a4 4 0 017-2.65A4 4 0 0119 11c0 5.65-7 10-7 10z"
                    fill="#fff"
                  />
                </svg>
              </span>
              <span className="font-display text-lg font-medium">Aria Health</span>
            </div>
            <p className="mt-4 max-w-xs text-sm text-white/75">
              Healthcare that begins with one conversation. Consult verified
              specialists, manage records and receive care — anywhere.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold">{col.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-white/70 transition-colors hover:text-white"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/15 pt-6 text-xs text-white/70 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Aria Health. For demonstration only — not a real medical service.</p>
          <p>Made with the PlayStation-inspired design system.</p>
        </div>
      </div>
    </footer>
  );
}
