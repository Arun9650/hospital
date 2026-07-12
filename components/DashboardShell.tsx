"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useState } from "react";
import { Logo } from "./Logo";
import { Avatar } from "./ui";
import { Icon } from "./Icon";
import { signOut } from "@/lib/actions/auth";

export type NavItem = { href: string; label: string; icon: ReactNode };

export function DashboardShell({
  nav,
  role,
  user,
  children,
}: {
  nav: NavItem[];
  role: string;
  user: { name: string; initials: string; color: string; sub: string };
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface-soft">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-[#e7e7e7] bg-white">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-surface-soft lg:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle sidebar"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <Logo />
            <span className="hidden rounded-full bg-surface-card px-2.5 py-1 text-xs font-medium text-mute sm:inline">
              {role}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href={roleNotifications(role)}
              className="relative flex h-9 w-9 items-center justify-center rounded-full hover:bg-surface-soft"
              aria-label="Notifications"
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
                <path
                  d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-warning" />
            </Link>
            <div className="flex items-center gap-2.5">
              <Avatar initials={user.initials} color={user.color} size={34} />
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium leading-tight">{user.name}</p>
                <p className="text-xs text-mute">{user.sub}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 top-16 z-30 flex w-64 transform flex-col border-r border-[#e7e7e7] bg-white transition-transform lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:translate-x-0 ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-4">
            {nav.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-[#eaf3fc] text-ps"
                      : "text-charcoal hover:bg-surface-soft"
                  }`}
                >
                  <span className="flex h-5 w-5 items-center justify-center">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="shrink-0 space-y-1 border-t border-[#e7e7e7] p-4">
            <Link
              href="/"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-mute transition-colors hover:bg-surface-soft"
            >
              <Icon name="arrow-left" size={18} /> Back to site
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-mute transition-colors hover:bg-surface-soft"
              >
                <Icon name="logout" size={18} /> Sign out
              </button>
            </form>
          </div>
        </aside>

        {open && (
          <div
            className="fixed inset-0 top-16 z-20 bg-black/30 lg:hidden"
            onClick={() => setOpen(false)}
          />
        )}

        {/* Main — re-keyed per route so each navigation fades in. */}
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <div key={pathname} className="page-enter">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function roleNotifications(role: string) {
  if (role.toLowerCase().includes("doctor")) return "/doctor/notifications";
  if (role.toLowerCase().includes("admin")) return "/admin/notifications";
  return "/patient/notifications";
}

/* Shared page header inside dashboards */
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-3xl font-light tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-mute">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
