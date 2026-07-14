"use client";

import { Star } from "lucide-react";
import type { Review } from "@/lib/data";
import { Reveal, RevealGroup, RevealItem } from "./Reveal";

export function Testimonials({ reviews }: { reviews: Review[] }) {
  const shown = reviews.slice(0, 3);
  return (
    <section className="section bg-surface-soft">
      <div className="container-x">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="eyebrow text-ps">Patient stories</p>
          <h2 className="mt-3 font-display text-4xl font-light tracking-tight lg:text-5xl">
            Calm, capable care people come back to
          </h2>
        </Reveal>

        <RevealGroup className="mt-14 grid gap-6 md:grid-cols-3">
          {shown.map((r) => (
            <RevealItem key={r.id} className="card-flat flex flex-col gap-5 p-7">
              <div className="flex gap-0.5" aria-label={`${r.rating} out of 5`}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className={i < Math.round(r.rating) ? "fill-ps text-ps" : "fill-ash text-ash"}
                  />
                ))}
              </div>
              <blockquote className="font-display text-lg font-light leading-relaxed tracking-tight text-charcoal">
                “{r.body}”
              </blockquote>
              <figcaption className="mt-auto flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-soft font-display font-medium text-ps">
                  {r.initials}
                </span>
                <span>
                  <span className="block text-sm font-medium text-ink">{r.patient}</span>
                  <span className="block text-xs text-mute">{r.date}</span>
                </span>
              </figcaption>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
