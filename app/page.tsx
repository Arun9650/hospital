import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { HeroSearch } from "@/components/HeroSearch";
import { DoctorCard } from "@/components/DoctorCard";
import { Accordion } from "@/components/Accordion";
import {
  Avatar,
  Badge,
  Button,
  Eyebrow,
  Section,
  Stars,
} from "@/components/ui";
import { services, howItWorks, faqs } from "@/lib/data";
import { getFeaturedDoctors, getSpecialties, getReviews } from "@/lib/db";

export default async function Home() {
  const [featuredDoctors, specialties, reviews] = await Promise.all([
    getFeaturedDoctors(),
    getSpecialties(),
    getReviews(),
  ]);
  return (
    <>
      <SiteNav />

      {/* ---- HERO (dark canvas) ------------------------------------- */}
      <section className="relative overflow-hidden bg-black text-white">
        <div className="pointer-events-none absolute -right-40 top-0 h-[560px] w-[560px] rounded-full bg-ps/20 blur-[120px]" />
        <div className="container-x relative grid items-center gap-12 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
          <div className="rise">
            <Badge tone="blue">24/7 verified specialists</Badge>
            <h1 className="mt-6 font-display text-[clamp(2.4rem,6vw,3.6rem)] font-light leading-[1.08] tracking-tight">
              Healthcare that begins with one conversation.
            </h1>
            <p className="mt-6 max-w-lg text-lg text-white/70">
              Discover trusted doctors, consult by video, audio or chat, and get
              digital prescriptions, lab tests and records — all in one calm,
              premium place.
            </p>

            <div className="mt-8 max-w-xl">
              <HeroSearch dark />
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button href="/patient/doctors">Book Appointment</Button>
              <Button href="/patient/doctors" variant="dark">
                Find a Doctor
              </Button>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4 text-sm text-white/60">
              <span className="flex items-center gap-2">
                <Stars value={5} dark /> 4.9 average rating
              </span>
              <span>48,000+ patients cared for</span>
              <span>1,200+ verified doctors</span>
            </div>
          </div>

          {/* Hero image placeholder — premium healthcare visual */}
          <div className="rise relative">
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0a2540] to-[#04101f]">
              <div className="aspect-[4/5] w-full bg-[radial-gradient(circle_at_30%_20%,rgba(0,112,209,0.35),transparent_55%)]">
                <div className="flex h-full flex-col justify-between p-6">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs backdrop-blur">
                      🎥 Live consultation
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-white/70">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-[#39d98a]" />
                      Connected
                    </span>
                  </div>
                  <div className="self-center text-center">
                    <Avatar initials="AR" color="#0070d1" size={96} />
                    <p className="mt-4 font-display text-xl font-light">Dr. Anaya Rao</p>
                    <p className="text-sm text-white/60">Cardiology · 14 yrs</p>
                  </div>
                  <div className="rounded-xl bg-white/10 p-4 backdrop-blur">
                    <p className="text-sm text-white/80">
                      “Let’s start with how you’ve been feeling this week.”
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-5 -left-5 hidden w-52 rounded-xl bg-white p-4 text-black shadow-lg sm:block">
              <p className="text-xs text-mute">Digital prescription</p>
              <p className="mt-1 font-display text-lg font-normal">Ready in seconds</p>
              <div className="mt-2 flex items-center gap-2 text-xs text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success" /> Signed & secure
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---- TOP SPECIALTIES (light) -------------------------------- */}
      <Section canvas="light">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Eyebrow>Browse by need</Eyebrow>
            <h2 className="mt-3 max-w-xl font-display text-4xl font-light tracking-tight">
              Top specialties, ready when you are
            </h2>
          </div>
          <Link href="/patient/doctors" className="btn btn-ghost">
            View all specialties →
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {specialties.map((s) => (
            <Link
              key={s.slug}
              href={`/patient/doctors?specialty=${s.slug}`}
              className="card-flat lift flex flex-col items-start gap-3 p-5"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eaf3fc] text-xl">
                {s.icon}
              </span>
              <div>
                <p className="font-medium">{s.name}</p>
                <p className="text-xs text-mute">{s.doctors} doctors</p>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      {/* ---- FEATURED DOCTORS (soft) -------------------------------- */}
      <Section canvas="soft">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Eyebrow>Handpicked & verified</Eyebrow>
            <h2 className="mt-3 max-w-xl font-display text-4xl font-light tracking-tight">
              Featured doctors this week
            </h2>
          </div>
          <Button href="/patient/doctors" variant="light">
            Browse all doctors
          </Button>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featuredDoctors.map((d) => (
            <DoctorCard key={d.id} doctor={d} />
          ))}
        </div>
      </Section>

      {/* ---- HOW IT WORKS (dark) ------------------------------------ */}
      <Section canvas="dark" id="how">
        <Eyebrow tone="onDark">The Aria way</Eyebrow>
        <h2 className="mt-3 max-w-2xl font-display text-4xl font-light tracking-tight">
          Care in four calm steps
        </h2>
        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {howItWorks.map((s) => (
            <div key={s.step} className="border-t border-white/15 pt-5">
              <span className="font-display text-3xl font-light text-ps">{s.step}</span>
              <h3 className="mt-4 font-display text-xl font-normal">{s.title}</h3>
              <p className="mt-2 text-sm text-white/60">{s.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ---- ONLINE CONSULTATION (light, split) --------------------- */}
      <Section canvas="light" id="consult">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#eaf3fc] to-[#f5f7fa] p-8">
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { icon: "🎥", t: "Video visits", d: "Face-to-face from home" },
                  { icon: "📞", t: "Audio calls", d: "Low-bandwidth friendly" },
                  { icon: "💬", t: "Secure chat", d: "Message on your time" },
                  { icon: "📄", t: "E-prescriptions", d: "Delivered instantly" },
                ].map((c) => (
                  <div key={c.t} className="card-flat p-5">
                    <span className="text-2xl">{c.icon}</span>
                    <p className="mt-3 font-medium">{c.t}</p>
                    <p className="text-xs text-mute">{c.d}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <Eyebrow>Online consultation</Eyebrow>
            <h2 className="mt-3 font-display text-4xl font-light tracking-tight">
              A clinic that fits in your pocket
            </h2>
            <p className="mt-5 max-w-md text-lg text-body-light">
              Connect with specialists over secure, encrypted video, audio or chat.
              Share photos and reports, get diagnosed, and receive a valid digital
              prescription — without a waiting room.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "End-to-end encrypted, HIPAA-style privacy",
                "Same-day appointments with many doctors",
                "Follow-ups and second opinions in a tap",
              ].map((li) => (
                <li key={li} className="flex items-start gap-3 text-charcoal">
                  <span className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#eaf3fc] text-ps">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  {li}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <Button href="/patient/doctors">Start a consultation</Button>
            </div>
          </div>
        </div>
      </Section>

      {/* ---- MEDICAL SERVICES (soft) -------------------------------- */}
      <Section canvas="soft" id="services">
        <Eyebrow>Everything under one roof</Eyebrow>
        <h2 className="mt-3 max-w-xl font-display text-4xl font-light tracking-tight">
          Medical services, thoughtfully connected
        </h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <div key={s.title} className="card-flat lift p-7">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#eaf3fc] text-2xl">
                {s.icon}
              </span>
              <h3 className="mt-5 font-display text-xl font-normal tracking-tight">
                {s.title}
              </h3>
              <p className="mt-2 text-body-light">{s.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ---- BLUE CTA BAND ------------------------------------------ */}
      <section className="bg-ps text-white">
        <div className="container-x flex flex-col items-start gap-8 py-20 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="max-w-2xl font-display text-4xl font-light tracking-tight">
              Your health deserves a real conversation.
            </h2>
            <p className="mt-4 max-w-xl text-white/80">
              Join thousands who found calmer, faster, more human care with Aria Health.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button href="/register" variant="light">
              Create free account
            </Button>
            <Button href="/patient/doctors" variant="dark">
              Find a Doctor
            </Button>
          </div>
        </div>
      </section>

      {/* ---- TESTIMONIALS (light) ----------------------------------- */}
      <Section canvas="light">
        <Eyebrow>Patient stories</Eyebrow>
        <h2 className="mt-3 max-w-xl font-display text-4xl font-light tracking-tight">
          Loved by patients everywhere
        </h2>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {reviews.map((r) => (
            <figure key={r.id} className="card-flat p-7">
              <Stars value={r.rating} />
              <blockquote className="mt-4 font-display text-xl font-light leading-relaxed tracking-tight text-charcoal">
                “{r.body}”
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <Avatar initials={r.initials} color="#0070d1" size={40} />
                <div>
                  <p className="text-sm font-medium">{r.patient}</p>
                  <p className="text-xs text-mute">{r.date}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </Section>

      {/* ---- FAQ (soft) --------------------------------------------- */}
      <Section canvas="soft">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <Eyebrow>Good to know</Eyebrow>
            <h2 className="mt-3 font-display text-4xl font-light tracking-tight">
              Frequently asked questions
            </h2>
            <p className="mt-4 max-w-sm text-body-light">
              Everything you need to feel confident booking your first consultation.
            </p>
            <div className="mt-6">
              <Button href="/patient/assistant" variant="light">
                Ask the AI assistant
              </Button>
            </div>
          </div>
          <div className="card-flat px-7">
            <Accordion items={faqs} />
          </div>
        </div>
      </Section>

      <SiteFooter />
    </>
  );
}
