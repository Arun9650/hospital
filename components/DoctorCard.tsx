import Link from "next/link";
import { Doctor } from "@/lib/data";
import { Avatar, Stars, Button } from "./ui";

export function DoctorCard({ doctor }: { doctor: Doctor }) {
  return (
    <div className="card-flat lift flex flex-col p-5">
      <div className="flex items-start gap-4">
        <Avatar initials={doctor.initials} color={doctor.photo} size={56} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link
              href={`/patient/doctors/${doctor.id}`}
              className="truncate font-display text-lg font-medium tracking-tight hover:text-ps"
            >
              {doctor.name}
            </Link>
            {doctor.verified && (
              <svg width="16" height="16" viewBox="0 0 24 24" className="shrink-0 text-ps">
                <circle cx="12" cy="12" r="10" fill="currentColor" />
                <path d="M17 9l-5.5 5.5L8 11" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <p className="text-sm text-mute">{doctor.specialty}</p>
          <p className="mt-0.5 text-xs text-mute">{doctor.qualifications}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3 text-sm">
        <Stars value={doctor.rating} />
        <span className="font-medium">{doctor.rating}</span>
        <span className="text-mute">({doctor.reviews})</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {doctor.tags.slice(0, 3).map((t) => (
          <span key={t} className="rounded-full bg-surface-card px-2.5 py-1 text-xs text-charcoal">
            {t}
          </span>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[#f0f0f0] pt-4 text-sm">
        <div>
          <p className="text-xs text-mute">Experience</p>
          <p className="font-medium">{doctor.experience} yrs</p>
        </div>
        <div>
          <p className="text-xs text-mute">Consultation</p>
          <p className="font-medium">${doctor.fee}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-success">
        <span className="h-1.5 w-1.5 rounded-full bg-success" />
        Next available: {doctor.nextSlot}
      </div>

      <div className="mt-4 flex gap-2">
        <Button href={`/patient/doctors/${doctor.id}`} variant="light" size="sm" className="flex-1">
          View profile
        </Button>
        <Button href={`/patient/book/${doctor.id}`} size="sm" className="flex-1">
          Book
        </Button>
      </div>
    </div>
  );
}
