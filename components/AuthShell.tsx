import { ReactNode } from "react";
import { Logo } from "./Logo";
import { Stars } from "./ui";

export function AuthShell({
  children,
  quote = "The whole thing felt human — a real conversation, then a prescription before I hung up.",
  by = "Priya S., patient",
}: {
  children: ReactNode;
  quote?: string;
  by?: string;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left — brand panel (dark canvas) */}
      <div className="relative hidden overflow-hidden bg-forest text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="pointer-events-none absolute -left-20 top-10 h-96 w-96 rounded-full bg-ps/25 blur-[120px]" />
        <div className="relative">
          <Logo dark />
        </div>
        <div className="relative max-w-md">
          <Stars value={5} dark />
          <p className="mt-6 font-display text-3xl font-light leading-snug tracking-tight">
            “{quote}”
          </p>
          <p className="mt-6 text-sm text-white/60">{by}</p>
        </div>
        <div className="relative flex gap-8 text-sm text-white/50">
          <span>48k+ patients</span>
          <span>1.2k+ doctors</span>
          <span>4.9 ★ rating</span>
        </div>
      </div>

      {/* Right — form panel (light canvas) */}
      <div className="flex flex-col justify-center bg-canvas-light px-6 py-12 sm:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
