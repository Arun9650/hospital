"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ShieldCheck, Clock, Star, Video, Check, ArrowRight } from "lucide-react";
import { fadeUp } from "./Reveal";

export function LandingHero() {
  const reduce = useReducedMotion();
  return (
    <section id="top" className="relative overflow-hidden bg-forest text-white">
      {/* teal glow field — decorative */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(48% 45% at 80% 8%, rgba(20,184,166,0.28), transparent 68%), radial-gradient(40% 45% at 5% 100%, rgba(45,212,191,0.14), transparent 66%)",
        }}
      />
      <div className="container-x relative grid items-center gap-14 pb-20 pt-32 lg:grid-cols-[1.05fr_0.95fr] lg:pb-28 lg:pt-40">
        <motion.div
          initial={reduce ? false : "hidden"}
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.09 } } }}
        >
          <motion.span
            variants={fadeUp}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm font-medium text-teal-bright"
          >
            <span className="h-2 w-2 animate-pulse rounded-full bg-teal" />
            24/7 verified specialists
          </motion.span>

          <motion.h1
            variants={fadeUp}
            className="mt-6 max-w-2xl font-display text-[clamp(2.5rem,6vw,4.2rem)] font-light leading-[1.04] tracking-tight [overflow-wrap:anywhere]"
          >
            Healthcare that begins with{" "}
            <span className="text-teal-bright">one conversation.</span>
          </motion.h1>

          <motion.p variants={fadeUp} className="mt-6 max-w-xl text-lg text-white/70">
            Meet trusted doctors over secure video, audio or chat — with digital
            prescriptions, lab tests and records in one calm, premium place. No
            waiting rooms, no queues.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-9 flex flex-wrap gap-3">
            <Link href="/patient/doctors" className="btn btn-primary">
              Book a consult <ArrowRight size={18} />
            </Link>
            <Link href="#how" className="btn btn-dark">
              See how it works
            </Link>
          </motion.div>

          <motion.ul
            variants={fadeUp}
            className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-3 text-sm text-white/65"
          >
            <li className="flex items-center gap-2">
              <Star size={16} className="fill-teal-bright text-teal-bright" /> 4.9 average rating
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-teal-bright" /> End-to-end encrypted
            </li>
            <li className="flex items-center gap-2">
              <Clock size={16} className="text-teal-bright" /> Avg. wait under 3 min
            </li>
          </motion.ul>
        </motion.div>

        {/* Real consultation card — content, not fake browser/phone chrome */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          className="relative"
        >
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 font-semibold text-teal-bright">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-teal" /> Live now
              </span>
              <span className="text-white/55">Today · 6:40 pm</span>
            </div>

            <div className="mt-4 flex items-center gap-3.5 rounded-2xl border border-white/10 bg-white/5 p-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-teal-bright to-ps font-display font-medium text-[#08211c]">
                AR
              </span>
              <div>
                <p className="font-medium">Dr. Anaya Rao</p>
                <p className="text-xs text-white/55">Cardiology · 14 yrs</p>
              </div>
              <span className="ml-auto text-teal-bright">
                <Video size={22} />
              </span>
            </div>

            <ul className="mt-4 space-y-2.5">
              {["Symptoms reviewed", "Prescription sent to pharmacy", "Follow-up saved to your record"].map(
                (t) => (
                  <li key={t} className="flex items-center gap-2.5 text-sm text-white/80">
                    <Check size={16} className="text-teal-bright" strokeWidth={2.6} /> {t}
                  </li>
                )
              )}
            </ul>

            <p className="mt-4 border-t border-white/10 pt-3 text-sm text-white/55">
              Consultation complete in 11 minutes
            </p>
          </div>

          <div className="absolute -bottom-5 -left-4 hidden rounded-2xl border border-[color:var(--hairline-light)] bg-canvas-light px-4 py-3 text-ink shadow-lg sm:block">
            <p className="text-xs text-mute">Digital prescription</p>
            <p className="font-display text-lg font-normal">Ready in seconds</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
