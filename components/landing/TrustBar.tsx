"use client";

import { Reveal, CountUp } from "./Reveal";

const STATS = [
  { value: 48000, suffix: "+", label: "Patients cared for" },
  { value: 1200, suffix: "+", label: "Verified doctors" },
  { value: 4.9, decimals: 1, suffix: "", label: "Average rating" },
  { value: 3, suffix: " min", label: "Average wait time" },
];

export function TrustBar() {
  return (
    <section className="border-y border-[color:var(--hairline-light)] bg-canvas-light">
      <div className="container-x grid grid-cols-2 gap-y-8 py-12 md:grid-cols-4">
        {STATS.map((s, i) => (
          <Reveal
            key={s.label}
            delay={i * 0.08}
            className={`px-4 text-center ${i > 0 ? "md:border-l md:border-[color:var(--hairline-light)]" : ""}`}
          >
            <div className="font-display text-4xl font-light tracking-tight text-ink lg:text-5xl">
              <CountUp value={s.value} suffix={s.suffix} decimals={s.decimals ?? 0} />
            </div>
            <div className="mt-2 text-sm text-mute">{s.label}</div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
