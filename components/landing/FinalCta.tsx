"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "./Reveal";

export function FinalCta() {
  return (
    <section className="section bg-canvas-light">
      <div className="container-x">
        <Reveal className="relative overflow-hidden rounded-[2rem] bg-forest px-6 py-16 text-center text-white sm:px-12 lg:py-24">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(55% 80% at 50% -10%, rgba(20,184,166,0.3), transparent 70%)",
            }}
          />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="font-display text-4xl font-light leading-[1.08] tracking-tight lg:text-6xl">
              Your health deserves a real conversation.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg text-white/70">
              Join thousands who traded the waiting room for calmer, faster, more
              human care. Your first consult is minutes away.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Link href="/register" className="btn btn-primary">
                Create free account <ArrowRight size={18} />
              </Link>
              <Link href="/patient/doctors" className="btn btn-dark">
                Find a doctor
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
