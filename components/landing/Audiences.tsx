"use client";

import Link from "next/link";
import {
  Clock,
  ShieldCheck,
  Pill,
  CalendarCheck,
  FileText,
  HeartPulse,
  Check,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { Reveal } from "./Reveal";

type Row = { icon: LucideIcon; title: string; sub: string };

const PATIENT_POINTS = [
  "See a board-certified clinician in minutes, day or night",
  "One private record — every note, script and result in one place",
  "Repeat prescriptions renewed without a second appointment",
  "Transparent pricing, shown before you ever book",
];
const PATIENT_ROWS: Row[] = [
  { icon: Clock, title: "Same-day", sub: "appointments across every specialty" },
  { icon: ShieldCheck, title: "Private by design", sub: "records only you and your clinician can open" },
  { icon: Pill, title: "Pharmacy direct", sub: "scripts sent to your chosen pharmacy instantly" },
];

const PROVIDER_POINTS = [
  "Set your own hours and see patients from anywhere",
  "Charting and e-prescribing handled in the flow of the visit",
  "Patient context surfaced automatically before each consult",
  "Paid weekly, with no billing admin to chase",
];
const PROVIDER_ROWS: Row[] = [
  { icon: CalendarCheck, title: "Your schedule", sub: "set availability, we handle the rest" },
  { icon: FileText, title: "Zero admin", sub: "notes and billing done inside the visit" },
  { icon: HeartPulse, title: "Real medicine", sub: "time with patients, not paperwork" },
];

function Panel({ rows, dark }: { rows: Row[]; dark?: boolean }) {
  return (
    <div
      className={`rounded-3xl border p-3 ${
        dark
          ? "border-white/10 bg-white/[0.05]"
          : "border-[color:var(--hairline-light)] bg-canvas-light shadow-[0_20px_50px_-30px_rgba(14,42,56,0.35)]"
      }`}
    >
      {rows.map((r, i) => (
        <div
          key={r.title}
          className={`flex items-start gap-4 p-5 ${
            i > 0 ? (dark ? "border-t border-white/10" : "border-t border-[color:var(--hairline-light)]") : ""
          }`}
        >
          <span
            className={`mt-0.5 flex h-10 w-10 flex-none items-center justify-center rounded-xl ${
              dark ? "bg-white/10 text-teal-bright" : "bg-teal-soft text-ps"
            }`}
          >
            <r.icon size={20} strokeWidth={1.9} />
          </span>
          <div>
            <p className={`font-display text-lg font-medium ${dark ? "text-white" : "text-ink"}`}>{r.title}</p>
            <p className={`text-sm ${dark ? "text-white/60" : "text-mute"}`}>{r.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ForPatients() {
  return (
    <section id="patients" className="section bg-surface-soft">
      <div className="container-x grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <Reveal>
          <p className="eyebrow text-ps">For patients</p>
          <h2 className="mt-3 max-w-md font-display text-4xl font-light tracking-tight lg:text-5xl">
            Healthcare that meets you where you are
          </h2>
          <p className="mt-5 max-w-md text-lg text-body-light">
            Whether it&apos;s 3am with a sick child or a quick script renewal on your
            lunch break, Aria is the same steady, expert care — on your terms.
          </p>
          <ul className="mt-7 flex flex-col gap-3.5">
            {PATIENT_POINTS.map((p) => (
              <li key={p} className="flex items-start gap-3 text-charcoal">
                <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-teal-soft text-ps">
                  <Check size={14} strokeWidth={2.6} />
                </span>
                {p}
              </li>
            ))}
          </ul>
          <Link href="/patient/doctors" className="btn btn-primary mt-8">
            Find a clinician <ArrowRight size={18} />
          </Link>
        </Reveal>
        <Reveal delay={0.1}>
          <Panel rows={PATIENT_ROWS} />
        </Reveal>
      </div>
    </section>
  );
}

export function ForProviders() {
  return (
    <section id="providers" className="section bg-forest text-white">
      <div className="container-x grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <Reveal className="order-2 lg:order-1">
          <Panel rows={PROVIDER_ROWS} dark />
        </Reveal>
        <Reveal delay={0.1} className="order-1 lg:order-2">
          <p className="eyebrow text-teal-bright">For providers</p>
          <h2 className="mt-3 max-w-md font-display text-4xl font-light tracking-tight lg:text-5xl">
            Practise the way you trained to
          </h2>
          <p className="mt-5 max-w-md text-lg text-white/70">
            Aria takes the friction out of virtual practice — so the visit is about
            the patient, not the software. Set your hours, see who you like, and let
            us carry the rest.
          </p>
          <ul className="mt-7 flex flex-col gap-3.5">
            {PROVIDER_POINTS.map((p) => (
              <li key={p} className="flex items-start gap-3 text-white/85">
                <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-white/10 text-teal-bright">
                  <Check size={14} strokeWidth={2.6} />
                </span>
                {p}
              </li>
            ))}
          </ul>
          <Link href="/register" className="btn btn-dark mt-8">
            Join as a provider <ArrowRight size={18} />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
