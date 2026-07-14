"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, Menu, X } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

const LINKS = [
  { label: "How it works", href: "#how" },
  { label: "For patients", href: "#patients" },
  { label: "For providers", href: "#providers" },
  { label: "Specialties", href: "#specialties" },
];

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4">
      <motion.nav
        initial={reduce ? false : { y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className={`flex w-full max-w-5xl items-center gap-4 rounded-full border px-4 py-2.5 transition-all duration-300 sm:px-5 ${
          scrolled
            ? "border-[color:var(--hairline-light)] bg-[rgba(247,250,251,0.82)] shadow-[0_10px_40px_-24px_rgba(14,42,56,0.5)] backdrop-blur-xl"
            : "border-transparent bg-transparent"
        }`}
      >
        <Link
          href="#top"
          className={`flex items-center gap-2.5 font-display text-lg font-medium tracking-tight transition-colors ${
            scrolled ? "text-ink" : "text-white"
          }`}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-ps text-white">
            <Activity size={18} strokeWidth={2.4} />
          </span>
          Aria <span className={scrolled ? "text-ps" : "text-teal-bright"}>Health</span>
        </Link>

        <ul className="ml-2 hidden items-center gap-7 md:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className={`group relative text-sm font-medium transition-colors ${
                  scrolled ? "text-ink/70 hover:text-ink" : "text-white/80 hover:text-white"
                }`}
              >
                {l.label}
                <span
                  className={`absolute -bottom-1 left-0 h-[1.5px] w-full origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100 ${
                    scrolled ? "bg-ps" : "bg-teal-bright"
                  }`}
                />
              </a>
            </li>
          ))}
        </ul>

        <div className="ml-auto hidden items-center gap-2 md:flex">
          <Link
            href="/login"
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              scrolled ? "text-ink/70 hover:text-ink" : "text-white/80 hover:text-white"
            }`}
          >
            Sign in
          </Link>
          <Link href="/patient/doctors" className="btn btn-primary btn-sm">
            Book a consult
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className={`ml-auto flex h-9 w-9 items-center justify-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ps md:hidden ${
            scrolled ? "text-ink hover:bg-surface-soft" : "text-white hover:bg-white/10"
          }`}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </motion.nav>

      {open && (
        <motion.div
          initial={reduce ? false : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-[72px] left-4 right-4 rounded-2xl border border-[color:var(--hairline-light)] bg-canvas-light p-3 shadow-lg backdrop-blur-xl md:hidden"
        >
          <ul className="flex flex-col">
            {LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-4 py-3 text-sm font-medium text-ink/80 transition-colors hover:bg-surface-soft"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex flex-col gap-2 border-t border-[color:var(--hairline-light)] pt-3">
            <Link href="/login" className="btn btn-light btn-sm w-full" onClick={() => setOpen(false)}>
              Sign in
            </Link>
            <Link href="/patient/doctors" className="btn btn-primary btn-sm w-full" onClick={() => setOpen(false)}>
              Book a consult
            </Link>
          </div>
        </motion.div>
      )}
    </header>
  );
}
