"use client";

import { useEffect, useRef, useState } from "react";
import "./tokens.css";

/* ---------------------------------------------------------------- icons */
type IconProps = { className?: string };
const S = (p: { children: React.ReactNode; className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
       strokeLinecap="round" strokeLinejoin="round" className={p.className} aria-hidden>
    {p.children}
  </svg>
);
const IconVideo = (p: IconProps) => <S className={p.className}><rect x="2.5" y="6" width="13" height="12" rx="2.5"/><path d="M15.5 10.5l6-3.5v10l-6-3.5"/></S>;
const IconCalendar = (p: IconProps) => <S className={p.className}><rect x="3" y="4.5" width="18" height="16" rx="2.5"/><path d="M3 9h18M8 2.5v4M16 2.5v4"/></S>;
const IconPill = (p: IconProps) => <S className={p.className}><rect x="3" y="8" width="18" height="8" rx="4" transform="rotate(45 12 12)"/><path d="M8.8 8.8l6.4 6.4"/></S>;
const IconShield = (p: IconProps) => <S className={p.className}><path d="M12 2.5l7 3v5c0 5-3.4 8.4-7 10-3.6-1.6-7-5-7-10v-5z"/><path d="M9 12l2 2 4-4"/></S>;
const IconClock = (p: IconProps) => <S className={p.className}><circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3 2"/></S>;
const IconChart = (p: IconProps) => <S className={p.className}><path d="M4 4v16h16"/><path d="M8 15l3-4 3 2 4-6"/></S>;
const IconHeart = (p: IconProps) => <S className={p.className}><path d="M12 20s-7-4.4-9.2-9C1.4 8.3 3 5 6.2 5 8.3 5 12 7 12 7s3.7-2 5.8-2C21 5 22.6 8.3 21.2 11 19 15.6 12 20 12 20z"/></S>;
const IconWave = (p: IconProps) => <S className={p.className}><path d="M2 12h3l2-6 3 12 3-9 2 3h7"/></S>;
const IconBrain = (p: IconProps) => <S className={p.className}><path d="M9 6a3 3 0 00-3 3 3 3 0 00-1 5.5A3 3 0 009 18V6zM15 6a3 3 0 013 3 3 3 0 011 5.5A3 3 0 0115 18V6z"/></S>;
const IconEye = (p: IconProps) => <S className={p.className}><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/></S>;
const IconTooth = (p: IconProps) => <S className={p.className}><path d="M12 4c-2-1.5-6-1.5-6 2.5 0 3 1 4 1.5 7 .4 2.3.6 4 1.5 4s1-2.5 1.5-4h1c.5 1.5.6 4 1.5 4s1.1-1.7 1.5-4c.5-3 1.5-4 1.5-7 0-4-4-4-6-2.5z"/></S>;
const IconStethoscope = (p: IconProps) => <S className={p.className}><path d="M5 3v5a4 4 0 008 0V3"/><path d="M9 15a5 5 0 0010 0v-2"/><circle cx="19" cy="11" r="2"/></S>;
const IconCheck = (p: IconProps) => <S className={p.className}><path d="M4 12.5l5 5 11-12"/></S>;
const IconArrow = (p: IconProps) => <S className={p.className}><path d="M5 12h13M13 6l6 6-6 6"/></S>;
const IconStar = (p: IconProps) => <svg viewBox="0 0 24 24" fill="currentColor" className={p.className} aria-hidden><path d="M12 2.5l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 18.6 6.1 21.3l1.2-6.6L2.5 9.5l6.6-.9z"/></svg>;

/* ---------------------------------------------------------------- reveal + count-up hooks */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".vt [data-reveal]");
    if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      els.forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }),
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

function Stat({ value, suffix = "", prefix = "", label }: { value: number; suffix?: string; prefix?: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Reduced-motion / no-IO: show the final value immediately. One-shot sync
    // set is intentional here and can't cause cascading renders.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (reduce || !("IntersectionObserver" in window)) { setN(value); return; }
    const io = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      const start = performance.now(), dur = 1400;
      const tick = (t: number) => {
        const p = Math.min(1, (t - start) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        setN(Math.round(value * eased));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, [value]);
  return (
    <div className="vt-stat" ref={ref}>
      <div className="vt-stat__num">{prefix}{n.toLocaleString()}{suffix}</div>
      <div className="vt-stat__label">{label}</div>
    </div>
  );
}

/* ---------------------------------------------------------------- data */
const STEPS = [
  { icon: IconCalendar, k: "Book in seconds", d: "Pick a specialty and a time that suits you. No phone queues, no waiting rooms — just a slot that's yours." },
  { icon: IconVideo, k: "Meet your clinician", d: "Join a calm, secure video room from any device. Your doctor has your history before you say hello." },
  { icon: IconPill, k: "Care that follows through", d: "Prescriptions, referrals and notes arrive in your record the moment your consult ends." },
];
const SPECIALTIES = [
  { icon: IconStethoscope, k: "General medicine" },
  { icon: IconHeart, k: "Cardiology" },
  { icon: IconBrain, k: "Mental health" },
  { icon: IconTooth, k: "Dermatology" },
  { icon: IconEye, k: "Ophthalmology" },
  { icon: IconWave, k: "Nutrition" },
  { icon: IconShield, k: "Paediatrics" },
  { icon: IconChart, k: "Endocrinology" },
];
const PATIENT_POINTS = [
  "See a board-certified clinician in minutes, day or night",
  "One private record — every note, script and result in one place",
  "Repeat prescriptions renewed without a second appointment",
  "Transparent pricing, shown before you ever book",
];
const DOCTOR_POINTS = [
  "Set your own hours and see patients from anywhere",
  "Charting, e-prescribing and notes handled in the flow of the visit",
  "Patient context surfaced automatically before each consult",
  "Paid weekly, with no billing admin to chase",
];
const QUOTES = [
  { q: "I booked at 9pm with a feverish toddler and spoke to a paediatrician by 9:12. It felt like having a doctor in the family.", n: "Priya N.", r: "Parent · Bristol" },
  { q: "As a GP I finally practise without the paperwork drowning the patient. The notes are done before I've closed the call.", n: "Dr. Marcus Feld", r: "General practitioner" },
  { q: "My repeat prescription used to take three phone calls. Now it lands in the app before I've made coffee.", n: "Eleanor V.", r: "Member · 2 years" },
];
const PLANS = [
  { name: "Pay as you go", price: "£29", per: "per visit", blurb: "For the occasional consult, with nothing to commit to.",
    feats: ["One video consultation", "Digital prescription included", "Notes saved to your record"], cta: "Book a visit", featured: false },
  { name: "Membership", price: "£19", per: "per month", blurb: "Unlimited everyday care for one person, all year round.",
    feats: ["Unlimited GP consultations", "Same-day appointments", "Free prescriptions & referrals", "Priority specialist access"], cta: "Start membership", featured: true },
  { name: "Family", price: "£39", per: "per month", blurb: "Cover up to six people under a single calm plan.",
    feats: ["Everything in Membership", "Up to 6 family members", "Shared care coordinator", "Paediatric priority line"], cta: "Cover your family", featured: false },
];

/* ---------------------------------------------------------------- page */
export default function VitaraLanding() {
  useReveal();
  const year = new Date().getFullYear();

  return (
    <div className="vt">
      <style>{CSS}</style>

      {/* NAV — N1b */}
      <header className="vt-nav">
        <div className="vt-nav__inner">
          <a className="vt-brand" href="#top" aria-label="Vitara Health home">
            <span className="vt-brand__mark"><IconHeart /></span>
            <span className="vt-brand__word">Vitara<span className="vt-brand__hue"> Health</span></span>
          </a>
          <nav className="vt-nav__links" aria-label="Primary">
            <a href="#how">How it works</a>
            <a href="#patients">For patients</a>
            <a href="#doctors">For doctors</a>
            <a href="#pricing">Pricing</a>
          </nav>
          <div className="vt-nav__cta">
            <a className="vt-btn vt-btn--ghost" href="#">Sign in</a>
            <a className="vt-btn vt-btn--primary" href="#pricing">Book a consult</a>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="vt-hero" id="top">
        <div className="vt-hero__field" aria-hidden />
        <div className="vt-shell vt-hero__inner">
          <div className="vt-hero__copy" data-reveal>
            <span className="vt-eyebrow"><span className="vt-dot" />Virtual care, done properly</span>
            <h1 className="vt-hero__title">
              A doctor&apos;s full attention, <span className="vt-accent">without the waiting room</span>
            </h1>
            <p className="vt-hero__lede">
              Vitara connects you with board-certified clinicians in minutes — calm, private
              consultations with prescriptions, notes and follow-ups that actually follow through.
            </p>
            <div className="vt-hero__actions">
              <a className="vt-btn vt-btn--primary vt-btn--lg" href="#pricing">Book a consult <IconArrow className="vt-btn__i" /></a>
              <a className="vt-btn vt-btn--ghost vt-btn--lg" href="#how">See how it works</a>
            </div>
            <ul className="vt-hero__proof">
              <li><IconShield className="vt-i-sm" /> End-to-end encrypted</li>
              <li><IconClock className="vt-i-sm" /> Avg. wait under 3 min</li>
              <li><IconCheck className="vt-i-sm" /> No membership required</li>
            </ul>
          </div>

          {/* Tier-A CSS visual: a real appointment card, no fake browser/phone chrome */}
          <div className="vt-hero__visual" data-reveal>
            <div className="vt-card vt-appt">
              <div className="vt-appt__head">
                <span className="vt-appt__live"><span className="vt-appt__pulse" />Live now</span>
                <span className="vt-appt__time">Today · 6:40 pm</span>
              </div>
              <div className="vt-appt__doc">
                <div className="vt-appt__avatar" aria-hidden>AF</div>
                <div>
                  <div className="vt-appt__name">Dr. Amara Fenn</div>
                  <div className="vt-appt__role">General medicine · 4.9 ★</div>
                </div>
                <span className="vt-appt__vid"><IconVideo /></span>
              </div>
              <div className="vt-appt__body">
                <p className="vt-appt__line"><IconCheck className="vt-i-sm vt-i-teal" /> Symptoms reviewed</p>
                <p className="vt-appt__line"><IconCheck className="vt-i-sm vt-i-teal" /> Prescription sent to pharmacy</p>
                <p className="vt-appt__line"><IconCheck className="vt-i-sm vt-i-teal" /> Follow-up added to your record</p>
              </div>
              <div className="vt-appt__foot">Consultation complete in 11 minutes</div>
            </div>
            <div className="vt-float vt-float--a"><IconHeart className="vt-i-sm vt-i-teal" /> 98% would return</div>
            <div className="vt-float vt-float--b"><IconStethoscope className="vt-i-sm vt-i-teal" /> 1,200+ clinicians</div>
          </div>
        </div>
      </section>

      {/* LIVE / TRUST BAR */}
      <section className="vt-livebar">
        <div className="vt-shell vt-livebar__grid">
          <Stat value={12450} suffix="+" label="Consultations today" />
          <Stat value={98} suffix="%" label="Patient satisfaction" />
          <Stat value={3} suffix=" min" label="Average wait time" />
          <Stat value={1200} suffix="+" label="Verified clinicians" />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="vt-section" id="how">
        <div className="vt-shell">
          <div className="vt-head" data-reveal>
            <p className="vt-kicker">How it works</p>
            <h2 className="vt-h2">Care in three unhurried steps</h2>
            <p className="vt-sub">No apps to wrestle, no forms to repeat. From first tap to signed prescription, the whole visit stays calm.</p>
          </div>
          <ol className="vt-steps">
            {STEPS.map((s, i) => (
              <li className="vt-step" key={s.k} data-reveal style={{ transitionDelay: `${i * 90}ms` }}>
                <span className="vt-step__n">{String(i + 1).padStart(2, "0")}</span>
                <span className="vt-step__icon"><s.icon /></span>
                <h3 className="vt-step__k">{s.k}</h3>
                <p className="vt-step__d">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* FOR PATIENTS */}
      <section className="vt-section vt-split" id="patients">
        <div className="vt-shell vt-split__grid">
          <div className="vt-split__copy" data-reveal>
            <p className="vt-kicker">For patients</p>
            <h2 className="vt-h2">Healthcare that meets you where you are</h2>
            <p className="vt-sub">Whether it&apos;s 3am with a sick child or a quick script renewal on your lunch break, Vitara is the same steady, expert care — on your terms.</p>
            <ul className="vt-checklist">
              {PATIENT_POINTS.map((p) => (
                <li key={p}><span className="vt-tick"><IconCheck /></span>{p}</li>
              ))}
            </ul>
            <a className="vt-btn vt-btn--primary" href="#pricing">Find a clinician <IconArrow className="vt-btn__i" /></a>
          </div>
          <div className="vt-split__panel" data-reveal>
            <div className="vt-card vt-mini">
              <div className="vt-mini__row"><IconClock className="vt-i-sm vt-i-teal" /><div><b>Same-day</b><span>appointments across every specialty</span></div></div>
              <div className="vt-mini__row"><IconShield className="vt-i-sm vt-i-teal" /><div><b>Private by design</b><span>records only you and your clinician can open</span></div></div>
              <div className="vt-mini__row"><IconPill className="vt-i-sm vt-i-teal" /><div><b>Pharmacy direct</b><span>scripts sent to your chosen pharmacy instantly</span></div></div>
            </div>
          </div>
        </div>
      </section>

      {/* FOR DOCTORS — dark navy canvas */}
      <section className="vt-section vt-dark" id="doctors">
        <div className="vt-shell vt-split__grid vt-split__grid--rev">
          <div className="vt-split__panel" data-reveal>
            <div className="vt-card vt-card--dark vt-mini">
              <div className="vt-mini__row"><IconChart className="vt-i-sm vt-i-teal" /><div><b>Your schedule</b><span>set availability, we handle the rest</span></div></div>
              <div className="vt-mini__row"><IconCalendar className="vt-i-sm vt-i-teal" /><div><b>Zero admin</b><span>notes and billing done in the visit</span></div></div>
              <div className="vt-mini__row"><IconHeart className="vt-i-sm vt-i-teal" /><div><b>Real medicine</b><span>time with patients, not paperwork</span></div></div>
            </div>
          </div>
          <div className="vt-split__copy" data-reveal>
            <p className="vt-kicker vt-kicker--onDark">For doctors</p>
            <h2 className="vt-h2">Practise the way you trained to</h2>
            <p className="vt-sub vt-sub--onDark">Vitara takes the friction out of virtual practice — so the visit is about the patient, not the software. Set your hours, see who you like, and let us carry the rest.</p>
            <ul className="vt-checklist vt-checklist--onDark">
              {DOCTOR_POINTS.map((p) => (
                <li key={p}><span className="vt-tick vt-tick--onDark"><IconCheck /></span>{p}</li>
              ))}
            </ul>
            <a className="vt-btn vt-btn--onDark" href="#">Join as a clinician <IconArrow className="vt-btn__i" /></a>
          </div>
        </div>
      </section>

      {/* SPECIALTIES */}
      <section className="vt-section" id="specialties">
        <div className="vt-shell">
          <div className="vt-head" data-reveal>
            <p className="vt-kicker">Popular specialties</p>
            <h2 className="vt-h2">A whole practice, a tap away</h2>
            <p className="vt-sub">From everyday concerns to specialist follow-ups, the right clinician is already here.</p>
          </div>
          <div className="vt-spec">
            {SPECIALTIES.map((s, i) => (
              <a className="vt-spec__card" href="#pricing" key={s.k} data-reveal style={{ transitionDelay: `${(i % 4) * 70}ms` }}>
                <span className="vt-spec__icon"><s.icon /></span>
                <span className="vt-spec__k">{s.k}</span>
                <IconArrow className="vt-spec__arrow" />
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="vt-section vt-soft" id="stories">
        <div className="vt-shell">
          <div className="vt-head" data-reveal>
            <p className="vt-kicker">In their words</p>
            <h2 className="vt-h2">Calm, capable care people come back to</h2>
          </div>
          <div className="vt-quotes">
            {QUOTES.map((t, i) => (
              <figure className="vt-quote" key={t.n} data-reveal style={{ transitionDelay: `${i * 90}ms` }}>
                <div className="vt-quote__stars" aria-label="5 out of 5">
                  {Array.from({ length: 5 }).map((_, s) => <IconStar key={s} className="vt-i-sm vt-i-teal" />)}
                </div>
                <blockquote>{t.q}</blockquote>
                <figcaption>
                  <span className="vt-quote__avatar" aria-hidden>{t.n[0]}</span>
                  <span><b>{t.n}</b><small>{t.r}</small></span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="vt-section" id="pricing">
        <div className="vt-shell">
          <div className="vt-head" data-reveal>
            <p className="vt-kicker">Plans</p>
            <h2 className="vt-h2">Honest pricing, shown up front</h2>
            <p className="vt-sub">No hidden fees, no surprise bills. Change or cancel any time.</p>
          </div>
          <div className="vt-pricing">
            {PLANS.map((pl, i) => (
              <div className={`vt-plan${pl.featured ? " vt-plan--featured" : ""}`} key={pl.name} data-reveal style={{ transitionDelay: `${i * 80}ms` }}>
                {pl.featured && <span className="vt-plan__tag">Most chosen</span>}
                <h3 className="vt-plan__name">{pl.name}</h3>
                <div className="vt-plan__price">{pl.price}<span> {pl.per}</span></div>
                <p className="vt-plan__blurb">{pl.blurb}</p>
                <ul className="vt-plan__feats">
                  {pl.feats.map((f) => <li key={f}><IconCheck className="vt-i-sm vt-i-teal" />{f}</li>)}
                </ul>
                <a className={`vt-btn ${pl.featured ? "vt-btn--primary" : "vt-btn--ghost"} vt-btn--block`} href="#">{pl.cta}</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="vt-section vt-final">
        <div className="vt-shell vt-final__inner" data-reveal>
          <div className="vt-final__glow" aria-hidden />
          <h2 className="vt-final__title">Your next appointment is<br />already waiting</h2>
          <p className="vt-final__sub">Join thousands who traded the waiting room for care that comes to them. First consult in under three minutes.</p>
          <div className="vt-hero__actions vt-final__actions">
            <a className="vt-btn vt-btn--primary vt-btn--lg" href="#pricing">Book your consult <IconArrow className="vt-btn__i" /></a>
            <a className="vt-btn vt-btn--onDark vt-btn--lg" href="#doctors">Practise with Vitara</a>
          </div>
        </div>
      </section>

      {/* FOOTER — Ft5 statement */}
      <footer className="vt-footer">
        <div className="vt-shell vt-footer__inner">
          <div className="vt-footer__lead">
            <a className="vt-brand vt-brand--footer" href="#top">
              <span className="vt-brand__mark"><IconHeart /></span>
              <span className="vt-brand__word">Vitara<span className="vt-brand__hue"> Health</span></span>
            </a>
            <p className="vt-footer__line">Unhurried, expert healthcare — wherever you happen to be.</p>
          </div>
          <nav className="vt-footer__cols" aria-label="Footer">
            <div><h4>Care</h4><a href="#how">How it works</a><a href="#specialties">Specialties</a><a href="#pricing">Pricing</a></div>
            <div><h4>Clinicians</h4><a href="#doctors">Join Vitara</a><a href="#">Clinician login</a><a href="#">Standards of care</a></div>
            <div><h4>Company</h4><a href="#">About</a><a href="#">Trust &amp; safety</a><a href="#">Contact</a></div>
          </nav>
        </div>
        <div className="vt-shell vt-footer__base">
          <span>© {year} Vitara Health. Not a substitute for emergency care — call your local emergency number.</span>
          <span className="vt-footer__legal"><a href="#">Privacy</a><a href="#">Terms</a></span>
        </div>
      </footer>
    </div>
  );
}

/* ---------------------------------------------------------------- CSS (scoped under .vt) */
const CSS = `
.vt{
  font-family:var(--v-font-body);
  color:var(--v-ink);
  background:var(--v-paper);
  -webkit-font-smoothing:antialiased;
  overflow-x:clip;
  line-height:1.55;
  letter-spacing:-0.006em;
}
.vt *,.vt *::before,.vt *::after{box-sizing:border-box}
.vt a{color:inherit;text-decoration:none}
.vt-shell{max-width:1160px;margin-inline:auto;padding-inline:24px;width:100%}
.vt h1,.vt h2,.vt h3{font-family:var(--v-font-display);font-weight:400;font-style:normal;overflow-wrap:anywhere;min-width:0}
.vt-accent{color:var(--v-teal-deep)}
.vt-i-sm{width:18px;height:18px;flex:none}
.vt-i-teal{color:var(--v-teal-deep)}

/* reveal */
.vt [data-reveal]{opacity:0;transform:translateY(22px);transition:opacity var(--v-dur) var(--v-ease-out),transform var(--v-dur) var(--v-ease-out)}
.vt [data-reveal].in{opacity:1;transform:none}
@media (prefers-reduced-motion:reduce){
  .vt [data-reveal]{opacity:1;transform:none;transition:none}
}

/* buttons */
.vt-btn{
  display:inline-flex;align-items:center;justify-content:center;gap:8px;
  font-family:var(--v-font-body);font-weight:600;font-size:var(--v-text-sm);
  padding:12px 22px;border-radius:var(--v-r-pill);border:1px solid transparent;
  cursor:pointer;white-space:nowrap;transition:transform var(--v-dur-s) var(--v-ease-out),background var(--v-dur-s) var(--v-ease-out),box-shadow var(--v-dur-s) var(--v-ease-out),border-color var(--v-dur-s) var(--v-ease-out)}
.vt-btn__i{width:18px;height:18px;transition:transform var(--v-dur-s) var(--v-ease-out)}
.vt-btn:hover .vt-btn__i{transform:translateX(3px)}
.vt-btn--lg{padding:15px 28px;font-size:var(--v-text-base)}
.vt-btn--block{width:100%}
.vt-btn--primary{background:var(--v-teal);color:oklch(20% 0.03 200);box-shadow:0 10px 24px -12px var(--v-teal)}
.vt-btn--primary:hover{transform:translateY(-2px);box-shadow:0 16px 32px -12px var(--v-teal)}
.vt-btn--ghost{background:var(--v-paper);color:var(--v-ink);border-color:var(--v-line)}
.vt-btn--ghost:hover{transform:translateY(-2px);border-color:var(--v-teal-line);background:var(--v-teal-soft)}
.vt-btn--onDark{background:transparent;color:var(--v-on-navy);border-color:var(--v-navy-line)}
.vt-btn--onDark:hover{transform:translateY(-2px);border-color:var(--v-teal);color:#fff}
.vt-btn:focus-visible{outline:3px solid var(--v-teal-deep);outline-offset:2px}

/* eyebrow / kicker */
.vt-eyebrow{display:inline-flex;align-items:center;gap:9px;font-size:var(--v-text-sm);font-weight:600;color:var(--v-teal-deep);background:var(--v-teal-soft);border:1px solid var(--v-teal-line);padding:7px 14px;border-radius:var(--v-r-pill)}
.vt-dot{width:8px;height:8px;border-radius:50%;background:var(--v-teal);box-shadow:0 0 0 4px var(--v-teal-soft);animation:vt-pulse 2.4s var(--v-ease-in-out) infinite}
@keyframes vt-pulse{0%,100%{opacity:1}50%{opacity:.35}}
.vt-kicker{font-size:var(--v-text-sm);font-weight:700;letter-spacing:.02em;text-transform:uppercase;color:var(--v-teal-deep);margin:0 0 14px}
.vt-kicker--onDark{color:var(--v-teal)}

/* NAV */
.vt-nav{position:sticky;top:0;z-index:50;background:oklch(99% 0.004 210 / 0.82);backdrop-filter:blur(14px);border-bottom:1px solid var(--v-line-soft)}
.vt-nav__inner{max-width:1160px;margin-inline:auto;padding:14px 24px;display:flex;align-items:center;gap:24px}
.vt-brand{display:inline-flex;align-items:center;gap:10px;font-family:var(--v-font-display);font-size:1.35rem;font-weight:500}
.vt-brand__mark{display:grid;place-items:center;width:34px;height:34px;border-radius:11px;background:var(--v-teal);color:oklch(22% 0.03 200)}
.vt-brand__mark svg{width:20px;height:20px}
.vt-brand__hue{color:var(--v-teal-deep)}
.vt-nav__links{display:flex;gap:28px;margin-left:8px}
.vt-nav__links a{font-size:var(--v-text-sm);font-weight:500;color:var(--v-ink-2);position:relative;padding:4px 0}
.vt-nav__links a::after{content:"";position:absolute;left:0;bottom:-2px;width:100%;height:1.5px;background:var(--v-teal);transform:scaleX(0);transform-origin:left;transition:transform var(--v-dur-s) var(--v-ease-out)}
.vt-nav__links a:hover{color:var(--v-ink)}
.vt-nav__links a:hover::after{transform:scaleX(1)}
.vt-nav__cta{display:flex;align-items:center;gap:10px;margin-left:auto}

/* HERO */
.vt-hero{position:relative;padding:clamp(48px,7vw,104px) 0 clamp(56px,7vw,96px);overflow:hidden}
.vt-hero__field{position:absolute;inset:0;z-index:0;background:
  radial-gradient(60% 55% at 82% 12%, oklch(72% 0.13 182 / 0.16), transparent 70%),
  radial-gradient(48% 50% at 8% 90%, oklch(72% 0.13 182 / 0.10), transparent 68%),
  linear-gradient(180deg, var(--v-paper-2), var(--v-paper))}
.vt-hero__inner{position:relative;z-index:1;display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,0.95fr);gap:clamp(32px,5vw,72px);align-items:center}
.vt-hero__title{font-size:var(--v-display);line-height:1.02;letter-spacing:-0.02em;margin:20px 0 0}
.vt-hero__lede{font-size:var(--v-text-lg);color:var(--v-muted);max-width:34ch;margin:22px 0 0}
.vt-hero__actions{display:flex;flex-wrap:wrap;gap:14px;margin-top:30px}
.vt-hero__proof{list-style:none;padding:0;margin:32px 0 0;display:flex;flex-wrap:wrap;gap:12px 26px}
.vt-hero__proof li{display:inline-flex;align-items:center;gap:8px;font-size:var(--v-text-sm);color:var(--v-ink-2);font-weight:500}

/* hero visual card */
.vt-hero__visual{position:relative}
.vt-card{background:var(--v-paper);border:1px solid var(--v-line);border-radius:var(--v-r-lg);box-shadow:var(--v-shadow-lg)}
.vt-appt{padding:22px;position:relative}
.vt-appt__head{display:flex;justify-content:space-between;align-items:center;font-size:var(--v-text-sm)}
.vt-appt__live{display:inline-flex;align-items:center;gap:8px;font-weight:600;color:var(--v-teal-deep)}
.vt-appt__pulse{width:9px;height:9px;border-radius:50%;background:var(--v-teal);animation:vt-pulse 1.6s var(--v-ease-in-out) infinite}
.vt-appt__time{color:var(--v-muted)}
.vt-appt__doc{display:flex;align-items:center;gap:13px;margin:18px 0;padding:14px;background:var(--v-paper-2);border-radius:var(--v-r-md);border:1px solid var(--v-line-soft)}
.vt-appt__avatar{width:46px;height:46px;border-radius:50%;display:grid;place-items:center;font-weight:700;font-size:var(--v-text-sm);color:oklch(22% 0.03 200);background:var(--v-teal)}
.vt-appt__name{font-weight:600;font-size:var(--v-text-base)}
.vt-appt__role{font-size:var(--v-text-xs);color:var(--v-muted)}
.vt-appt__vid{margin-left:auto;color:var(--v-teal-deep)}
.vt-appt__vid svg{width:24px;height:24px}
.vt-appt__body{display:flex;flex-direction:column;gap:11px}
.vt-appt__line{display:flex;align-items:center;gap:10px;font-size:var(--v-text-sm);color:var(--v-ink-2);margin:0}
.vt-appt__foot{margin-top:18px;padding-top:15px;border-top:1px solid var(--v-line-soft);font-size:var(--v-text-sm);color:var(--v-muted)}
.vt-float{position:absolute;display:inline-flex;align-items:center;gap:8px;background:var(--v-paper);border:1px solid var(--v-line);border-radius:var(--v-r-pill);padding:9px 15px;font-size:var(--v-text-sm);font-weight:600;box-shadow:var(--v-shadow-md);animation:vt-float 5s var(--v-ease-in-out) infinite}
.vt-float--a{top:-16px;left:-22px}
.vt-float--b{bottom:-18px;right:-14px;animation-delay:1.2s}
@keyframes vt-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
@media (prefers-reduced-motion:reduce){.vt-float,.vt-dot,.vt-appt__pulse{animation:none}}

/* LIVE BAR */
.vt-livebar{background:var(--v-navy);color:var(--v-on-navy);padding:38px 0}
.vt-livebar__grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:24px}
.vt-stat{text-align:center;border-left:1px solid var(--v-navy-line);padding:6px 12px}
.vt-stat:first-child{border-left:none}
.vt-stat__num{font-family:var(--v-font-display);font-size:var(--v-text-3xl);font-weight:500;line-height:1;color:#fff;letter-spacing:-0.02em}
.vt-stat__label{font-size:var(--v-text-sm);color:var(--v-on-navy-mut);margin-top:8px}

/* SECTION shells */
.vt-section{padding:clamp(64px,9vw,120px) 0}
.vt-soft{background:var(--v-teal-soft)}
.vt-head{max-width:640px;margin:0 auto clamp(40px,5vw,64px);text-align:center}
.vt-h2{font-size:var(--v-text-3xl);line-height:1.08;letter-spacing:-0.018em;margin:0}
.vt-sub{font-size:var(--v-text-lg);color:var(--v-muted);margin:16px 0 0}
.vt-sub--onDark{color:var(--v-on-navy-mut)}

/* STEPS */
.vt-steps{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px;counter-reset:s}
.vt-step{position:relative;background:var(--v-paper);border:1px solid var(--v-line);border-radius:var(--v-r-lg);padding:34px 28px;transition:transform var(--v-dur-s) var(--v-ease-out),box-shadow var(--v-dur-s) var(--v-ease-out),border-color var(--v-dur-s) var(--v-ease-out)}
.vt-step:hover{transform:translateY(-4px);box-shadow:var(--v-shadow-md);border-color:var(--v-teal-line)}
.vt-step__n{font-family:var(--v-font-display);font-size:var(--v-text-sm);color:var(--v-teal-deep);font-weight:600}
.vt-step__icon{display:grid;place-items:center;width:52px;height:52px;border-radius:15px;background:var(--v-teal-soft);color:var(--v-teal-deep);margin:16px 0 18px}
.vt-step__icon svg{width:26px;height:26px}
.vt-step__k{font-size:var(--v-text-xl);margin:0 0 10px}
.vt-step__d{font-size:var(--v-text-sm);color:var(--v-muted);margin:0}

/* SPLIT (patients/doctors) */
.vt-split__grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:clamp(32px,5vw,72px);align-items:center}
.vt-split__copy .vt-h2{max-width:16ch}
.vt-checklist{list-style:none;padding:0;margin:26px 0 30px;display:flex;flex-direction:column;gap:14px}
.vt-checklist li{display:flex;align-items:flex-start;gap:13px;font-size:var(--v-text-base);color:var(--v-ink-2)}
.vt-checklist--onDark li{color:var(--v-on-navy)}
.vt-tick{flex:none;display:grid;place-items:center;width:24px;height:24px;border-radius:50%;background:var(--v-teal-soft);color:var(--v-teal-deep);margin-top:1px}
.vt-tick svg{width:14px;height:14px;stroke-width:2.2}
.vt-tick--onDark{background:oklch(72% 0.13 182 / 0.16);color:var(--v-teal)}
.vt-mini{padding:12px}
.vt-mini__row{display:flex;align-items:flex-start;gap:14px;padding:18px;border-radius:var(--v-r-md)}
.vt-mini__row+.vt-mini__row{border-top:1px solid var(--v-line-soft)}
.vt-card--dark .vt-mini__row+.vt-mini__row{border-top:1px solid var(--v-navy-line)}
.vt-mini__row svg{margin-top:2px}
.vt-mini__row b{display:block;font-family:var(--v-font-display);font-weight:500;font-size:var(--v-text-lg)}
.vt-mini__row span{font-size:var(--v-text-sm);color:var(--v-muted)}
.vt-card--dark .vt-mini__row span{color:var(--v-on-navy-mut)}

/* DARK canvas */
.vt-dark{background:var(--v-navy);color:var(--v-on-navy)}
.vt-dark .vt-h2{color:#fff}
.vt-card--dark{background:var(--v-navy-2);border-color:var(--v-navy-line);box-shadow:none}
.vt-split__grid--rev .vt-split__panel{order:-1}

/* SPECIALTIES */
.vt-spec{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}
.vt-spec__card{display:flex;align-items:center;gap:14px;padding:20px;background:var(--v-paper);border:1px solid var(--v-line);border-radius:var(--v-r-md);font-weight:600;font-size:var(--v-text-base);transition:transform var(--v-dur-s) var(--v-ease-out),border-color var(--v-dur-s) var(--v-ease-out),box-shadow var(--v-dur-s) var(--v-ease-out)}
.vt-spec__card:hover{transform:translateY(-3px);border-color:var(--v-teal-line);box-shadow:var(--v-shadow-md)}
.vt-spec__icon{display:grid;place-items:center;width:44px;height:44px;border-radius:12px;background:var(--v-teal-soft);color:var(--v-teal-deep);flex:none}
.vt-spec__icon svg{width:22px;height:22px}
.vt-spec__k{min-width:0}
.vt-spec__arrow{width:18px;height:18px;margin-left:auto;color:var(--v-muted);opacity:0;transform:translateX(-4px);transition:opacity var(--v-dur-s) var(--v-ease-out),transform var(--v-dur-s) var(--v-ease-out)}
.vt-spec__card:hover .vt-spec__arrow{opacity:1;transform:none;color:var(--v-teal-deep)}

/* QUOTES */
.vt-quotes{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px}
.vt-quote{margin:0;background:var(--v-paper);border:1px solid var(--v-line);border-radius:var(--v-r-lg);padding:30px 26px;display:flex;flex-direction:column;gap:16px}
.vt-quote__stars{display:flex;gap:3px}
.vt-quote blockquote{margin:0;font-family:var(--v-font-display);font-weight:400;font-size:var(--v-text-lg);line-height:1.45;color:var(--v-ink)}
.vt-quote figcaption{display:flex;align-items:center;gap:12px;margin-top:auto}
.vt-quote__avatar{display:grid;place-items:center;width:40px;height:40px;border-radius:50%;background:var(--v-teal-soft);color:var(--v-teal-deep);font-weight:700;font-family:var(--v-font-display)}
.vt-quote figcaption b{display:block;font-size:var(--v-text-sm)}
.vt-quote figcaption small{font-size:var(--v-text-xs);color:var(--v-muted)}

/* PRICING */
.vt-pricing{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px;align-items:start}
.vt-plan{position:relative;background:var(--v-paper);border:1px solid var(--v-line);border-radius:var(--v-r-lg);padding:32px 28px;display:flex;flex-direction:column}
.vt-plan--featured{border-color:var(--v-teal);box-shadow:var(--v-shadow-md);transform:translateY(-8px)}
.vt-plan__tag{position:absolute;top:-13px;left:28px;background:var(--v-teal);color:oklch(20% 0.03 200);font-size:var(--v-text-xs);font-weight:700;padding:5px 13px;border-radius:var(--v-r-pill)}
.vt-plan__name{font-size:var(--v-text-xl);margin:0}
.vt-plan__price{font-family:var(--v-font-display);font-size:var(--v-text-3xl);font-weight:500;margin:12px 0 4px;letter-spacing:-0.02em}
.vt-plan__price span{font-family:var(--v-font-body);font-size:var(--v-text-sm);font-weight:500;color:var(--v-muted)}
.vt-plan__blurb{font-size:var(--v-text-sm);color:var(--v-muted);margin:0 0 20px}
.vt-plan__feats{list-style:none;padding:0;margin:0 0 26px;display:flex;flex-direction:column;gap:12px;flex:1}
.vt-plan__feats li{display:flex;align-items:flex-start;gap:11px;font-size:var(--v-text-sm);color:var(--v-ink-2)}
.vt-plan__feats svg{margin-top:2px;flex:none}

/* FINAL CTA */
.vt-final{background:var(--v-navy)}
.vt-final__inner{position:relative;text-align:center;background:var(--v-navy-2);border:1px solid var(--v-navy-line);border-radius:var(--v-r-lg);padding:clamp(48px,7vw,88px) 28px;overflow:hidden}
.vt-final__glow{position:absolute;inset:0;background:radial-gradient(60% 90% at 50% -10%, oklch(72% 0.13 182 / 0.22), transparent 70%);pointer-events:none}
.vt-final__title{position:relative;font-size:var(--v-text-3xl);line-height:1.08;color:#fff;margin:0;letter-spacing:-0.018em}
.vt-final__sub{position:relative;font-size:var(--v-text-lg);color:var(--v-on-navy-mut);max-width:48ch;margin:18px auto 0}
.vt-final__actions{position:relative;justify-content:center;margin-top:34px}

/* FOOTER */
.vt-footer{background:var(--v-navy);color:var(--v-on-navy-mut);padding:64px 0 40px}
.vt-footer__inner{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,2fr);gap:48px}
.vt-brand--footer{color:#fff}
.vt-footer__line{max-width:30ch;margin:16px 0 0;font-size:var(--v-text-sm)}
.vt-footer__cols{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px}
.vt-footer__cols h4{font-family:var(--v-font-body);font-size:var(--v-text-xs);text-transform:uppercase;letter-spacing:.06em;color:var(--v-on-navy);margin:0 0 14px}
.vt-footer__cols a{display:block;font-size:var(--v-text-sm);padding:5px 0;transition:color var(--v-dur-s) var(--v-ease-out)}
.vt-footer__cols a:hover{color:var(--v-teal)}
.vt-footer__base{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;margin-top:48px;padding-top:24px;border-top:1px solid var(--v-navy-line);font-size:var(--v-text-xs)}
.vt-footer__legal{display:flex;gap:20px}
.vt-footer__legal a:hover{color:var(--v-teal)}

/* ---- responsive ---- */
@media (max-width:960px){
  .vt-hero__inner,.vt-split__grid{grid-template-columns:minmax(0,1fr)}
  .vt-split__grid--rev .vt-split__panel{order:0}
  .vt-hero__visual{max-width:440px}
  .vt-steps,.vt-quotes,.vt-pricing{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}
  .vt-spec{grid-template-columns:repeat(2,minmax(0,1fr))}
  .vt-livebar__grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:20px 16px}
  .vt-stat:nth-child(3){border-left:none}
  .vt-plan--featured{transform:none}
  .vt-footer__inner{grid-template-columns:minmax(0,1fr)}
}
@media (max-width:680px){
  .vt-nav__links{display:none}
  .vt-nav__cta .vt-btn--ghost{display:none}
  .vt-steps,.vt-quotes,.vt-pricing,.vt-livebar__grid{grid-template-columns:minmax(0,1fr)}
  .vt-stat{border-left:none;text-align:left}
  .vt-livebar__grid{gap:22px}
  .vt-stat{border-left:none;border-top:1px solid var(--v-navy-line);padding-top:16px}
  .vt-stat:first-child{border-top:none}
  .vt-footer__cols{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}
  .vt-float--a{left:-6px}
  .vt-float--b{right:-4px}
}
`;
