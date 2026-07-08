import Link from "next/link";
import { notFound } from "next/navigation";
import { PatientShell } from "@/components/roleShells";
import { Avatar, Badge, Button, Stars, VerifiedBadge } from "@/components/ui";
import { Tabs } from "@/components/Tabs";
import { bookingDays } from "@/lib/data";
import { getDoctor, getDoctors, getReviews } from "@/lib/db";

export async function generateStaticParams() {
  const doctors = await getDoctors();
  return doctors.map((d) => ({ id: d.id }));
}

export default async function DoctorProfile({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const doctor = await getDoctor(id);
  if (!doctor) notFound();

  const docReviews = await getReviews(doctor.id);
  const allReviews = await getReviews();
  const displayReviews = docReviews.length ? docReviews : allReviews.slice(0, 3);

  return (
    <PatientShell>
      <Link href="/patient/doctors" className="text-sm text-ps hover:underline">
        ← Back to doctors
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Main */}
        <div className="space-y-6">
          {/* Header card */}
          <div className="card-flat p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <Avatar initials={doctor.initials} color={doctor.photo} size={88} />
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="font-display text-3xl font-light tracking-tight">{doctor.name}</h1>
                  {doctor.verified && <VerifiedBadge />}
                </div>
                <p className="mt-1 text-mute">
                  {doctor.specialty} · {doctor.qualifications}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                  <span className="flex items-center gap-1.5">
                    <Stars value={doctor.rating} /> <span className="font-medium">{doctor.rating}</span>
                    <span className="text-mute">({doctor.reviews} reviews)</span>
                  </span>
                  <span className="text-mute">🩺 {doctor.experience} yrs experience</span>
                  <span className="text-mute">📍 {doctor.location}</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {doctor.modes.map((m) => (
                    <Badge key={m} tone="soft">
                      {m}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="card-flat p-6">
            <Tabs
              tabs={[
                {
                  label: "About",
                  content: (
                    <div className="space-y-6">
                      <p className="max-w-2xl text-body-light">{doctor.about}</p>
                      <div>
                        <h3 className="font-medium">Areas of focus</h3>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {doctor.tags.map((t) => (
                            <span key={t} className="rounded-full bg-surface-card px-3 py-1.5 text-sm">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <InfoRow label="Languages" value={doctor.languages.join(", ")} />
                        <InfoRow label="Consultation fee" value={`$${doctor.fee}`} />
                        <InfoRow label="Next available" value={doctor.nextSlot} />
                        <InfoRow label="Response time" value="Usually within 10 min" />
                      </div>
                    </div>
                  ),
                },
                {
                  label: `Reviews (${doctor.reviews})`,
                  content: (
                    <div className="space-y-5">
                      {displayReviews.map((r) => (
                        <div key={r.id} className="border-b border-[#f0f0f0] pb-5 last:border-0">
                          <div className="flex items-center gap-3">
                            <Avatar initials={r.initials} color="#0070d1" size={36} />
                            <div>
                              <p className="text-sm font-medium">{r.patient}</p>
                              <div className="flex items-center gap-2">
                                <Stars value={r.rating} />
                                <span className="text-xs text-mute">{r.date}</span>
                              </div>
                            </div>
                          </div>
                          <p className="mt-3 text-body-light">{r.body}</p>
                        </div>
                      ))}
                    </div>
                  ),
                },
                {
                  label: "Availability",
                  content: (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {bookingDays.map((d) => (
                        <div key={d.date} className="card p-4">
                          <p className="text-sm font-medium">
                            {d.label} <span className="text-mute">· {d.date}</span>
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {d.slots.slice(0, 3).map((s) => (
                              <span key={s} className="rounded-full bg-white px-3 py-1 text-xs">
                                {s}
                              </span>
                            ))}
                            {d.slots.length > 3 && (
                              <span className="rounded-full bg-white px-3 py-1 text-xs text-ps">
                                +{d.slots.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </div>

        {/* Sticky booking card */}
        <aside>
          <div className="card-flat sticky top-24 p-6">
            <p className="text-sm text-mute">Consultation fee</p>
            <p className="font-display text-3xl font-light">
              ${doctor.fee} <span className="text-sm text-mute">/ session</span>
            </p>
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-[#e5f5ee] px-3 py-2 text-sm text-success">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Next: {doctor.nextSlot}
            </div>
            <div className="mt-5 space-y-2">
              <Button href={`/patient/messages?doctor=${doctor.id}`} full>
                💬 Message doctor
              </Button>
              <Button href={`/patient/book/${doctor.id}`} variant="light" full>
                Book appointment
              </Button>
              <Button href="/patient/consultation" variant="ghost" full>
                Instant video consult
              </Button>
            </div>
            <p className="mt-3 text-center text-xs text-mute">
              Start with a chat — usually replied to within 10 min.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-mute">
              <li className="flex items-center gap-2">✅ Verified & licensed</li>
              <li className="flex items-center gap-2">🔒 Encrypted & private</li>
              <li className="flex items-center gap-2">📄 Digital prescription included</li>
            </ul>
          </div>
        </aside>
      </div>
    </PatientShell>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface-card p-4">
      <p className="text-xs text-mute">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}
