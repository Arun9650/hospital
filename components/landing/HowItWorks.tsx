"use client";

import { MessageCircle, UsersRound, Video, ClipboardCheck, type LucideIcon } from "lucide-react";
import { howItWorks } from "@/lib/data";
import { Reveal, RevealGroup, RevealItem } from "./Reveal";

const ICONS: LucideIcon[] = [MessageCircle, UsersRound, Video, ClipboardCheck];

export function HowItWorks() {
  return (
    <section id="how" className="section bg-canvas-light">
      <div className="container-x">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="eyebrow text-ps">The Aria way</p>
          <h2 className="mt-3 font-display text-4xl font-light tracking-tight lg:text-5xl">
            Care in four calm steps
          </h2>
          <p className="mt-4 text-lg text-body-light">
            No apps to wrestle, no forms to repeat. From first message to signed
            prescription, the whole visit stays unhurried.
          </p>
        </Reveal>

        <RevealGroup className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {howItWorks.map((s, i) => {
            const Icon = ICONS[i] ?? MessageCircle;
            return (
              <RevealItem
                key={s.step}
                className="card-flat lift relative flex flex-col p-7"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-soft text-ps">
                  <Icon size={24} strokeWidth={1.8} />
                </span>
                <span className="mt-5 font-display text-sm font-medium text-ps">{s.step}</span>
                <h3 className="mt-1.5 font-display text-xl font-normal tracking-tight">{s.title}</h3>
                <p className="mt-2 text-sm text-body-light">{s.desc}</p>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </div>
    </section>
  );
}
