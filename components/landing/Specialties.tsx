"use client";

import Link from "next/link";
import {
  Heart,
  Brain,
  Baby,
  Bone,
  Eye,
  Ear,
  Stethoscope,
  Smile,
  Salad,
  Microscope,
  Activity,
  ArrowUpRight,
  type LucideIcon,
} from "lucide-react";
import type { Specialty } from "@/lib/data";
import { Reveal, RevealGroup, RevealItem } from "./Reveal";

/** Map a specialty by keyword to a line icon; falls back to a stethoscope. */
function iconFor(s: Specialty): LucideIcon {
  const k = `${s.slug} ${s.name}`.toLowerCase();
  const pairs: [string, LucideIcon][] = [
    ["cardio", Heart],
    ["heart", Heart],
    ["neuro", Brain],
    ["psych", Brain],
    ["mental", Brain],
    ["pedia", Baby],
    ["child", Baby],
    ["ortho", Bone],
    ["bone", Bone],
    ["ophthal", Eye],
    ["eye", Eye],
    ["ent", Ear],
    ["derm", Smile],
    ["skin", Smile],
    ["dent", Smile],
    ["nutri", Salad],
    ["diet", Salad],
    ["lab", Microscope],
    ["general", Stethoscope],
    ["family", Stethoscope],
    ["physician", Stethoscope],
  ];
  for (const [key, Icon] of pairs) if (k.includes(key)) return Icon;
  return Activity;
}

export function Specialties({ specialties }: { specialties: Specialty[] }) {
  return (
    <section id="specialties" className="section bg-canvas-light">
      <div className="container-x">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="eyebrow text-ps">Popular specialties</p>
          <h2 className="mt-3 font-display text-4xl font-light tracking-tight lg:text-5xl">
            A whole practice, a tap away
          </h2>
          <p className="mt-4 text-lg text-body-light">
            From everyday concerns to specialist follow-ups, the right clinician is
            already here.
          </p>
        </Reveal>

        <RevealGroup className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {specialties.map((s) => {
            const Icon = iconFor(s);
            return (
              <RevealItem key={s.slug}>
                <Link
                  href={`/patient/doctors?specialty=${s.slug}`}
                  className="card-flat lift group flex h-full items-center gap-4 p-5"
                >
                  <span className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-teal-soft text-ps">
                    <Icon size={22} strokeWidth={1.9} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-ink">{s.name}</span>
                    <span className="block text-xs text-mute">{s.doctors} doctors</span>
                  </span>
                  <ArrowUpRight
                    size={18}
                    className="ml-auto flex-none text-mute opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-ps group-hover:opacity-100"
                  />
                </Link>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </div>
    </section>
  );
}
