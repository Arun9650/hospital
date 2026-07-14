import Link from "next/link";
import { Activity } from "lucide-react";

const COLS: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: "Care",
    links: [
      { label: "How it works", href: "#how" },
      { label: "Specialties", href: "#specialties" },
      { label: "Book a consult", href: "/patient/doctors" },
      { label: "AI assistant", href: "/patient/assistant" },
    ],
  },
  {
    heading: "Providers",
    links: [
      { label: "Join Aria", href: "/register" },
      { label: "Provider login", href: "/login" },
      { label: "Standards of care", href: "#providers" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "#top" },
      { label: "Trust & safety", href: "#patients" },
      { label: "Contact", href: "#top" },
    ],
  },
];

export function LandingFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-forest-deep text-white">
      <div className="container-x py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_2fr]">
          <div>
            <Link href="#top" className="inline-flex items-center gap-2.5 font-display text-2xl font-medium tracking-tight">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ps text-white">
                <Activity size={20} strokeWidth={2.4} />
              </span>
              Aria <span className="text-teal-bright">Health</span>
            </Link>
            <p className="mt-5 max-w-xs text-sm text-white/60">
              Unhurried, expert healthcare — wherever you happen to be.
            </p>
          </div>

          <nav className="grid grid-cols-2 gap-8 sm:grid-cols-3" aria-label="Footer">
            {COLS.map((col) => (
              <div key={col.heading}>
                <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-white/50">
                  {col.heading}
                </h3>
                <ul className="mt-4 flex flex-col gap-2.5">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link
                        href={l.href}
                        className="text-sm text-white/70 transition-colors hover:text-teal-bright"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {year} Aria Health. Not a substitute for emergency care — call your
            local emergency number.
          </span>
          <span className="flex gap-6">
            <Link href="#top" className="transition-colors hover:text-teal-bright">Privacy</Link>
            <Link href="#top" className="transition-colors hover:text-teal-bright">Terms</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
