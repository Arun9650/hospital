"use client";

import Link from "next/link";
import { useState } from "react";
import { Logo } from "./Logo";
import { Button } from "./ui";

const links = [
  { href: "/patient/doctors", label: "Find a Doctor" },
  { href: "/#services", label: "Services" },
  { href: "/#how", label: "How it works" },
  { href: "/patient/assistant", label: "AI Assistant" },
  { href: "/doctor/register", label: "For Doctors" },
];

export function SiteNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/95 backdrop-blur">
      <div className="container-x flex h-16 items-center justify-between">
        <Logo dark />

        <nav className="hidden items-center gap-8 lg:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-white/70 transition-colors hover:text-white"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/login"
            className="text-sm font-medium text-white/80 transition-colors hover:text-white"
          >
            Log in
          </Link>
          <Button href="/register" size="sm">
            Get started
          </Button>
        </div>

        <button
          className="flex h-10 w-10 items-center justify-center rounded-full text-white lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-black px-6 py-4 lg:hidden">
          <nav className="flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-3 text-base font-medium text-white/80 hover:bg-white/5"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-3">
            <Button href="/login" variant="dark" full>
              Log in
            </Button>
            <Button href="/register" full>
              Get started
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
