import { Appointment, getDoctor } from "@/lib/data";
import { Avatar, Badge, Button } from "./ui";
import { Icon, type IconName } from "./Icon";

const modeIcon: Record<Appointment["mode"], IconName> = {
  Video: "video",
  Audio: "phone",
  Chat: "chat",
  "In-person": "hospital",
};

const statusTone: Record<Appointment["status"], "green" | "blue" | "amber" | "red"> = {
  Upcoming: "blue",
  Completed: "green",
  Pending: "amber",
  Cancelled: "red",
};

export function AppointmentCard({
  appt,
  actions,
}: {
  appt: Appointment;
  actions?: React.ReactNode;
}) {
  const doc = getDoctor(appt.doctorId);
  return (
    <div className="card-flat lift flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <Avatar
          initials={doc?.initials ?? appt.doctorName.slice(0, 2)}
          color={doc?.photo ?? "#0070d1"}
          size={48}
        />
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-display text-base font-medium tracking-tight">
              {appt.doctorName}
            </p>
            <Badge tone={statusTone[appt.status]}>{appt.status}</Badge>
          </div>
          <p className="text-sm text-mute">{appt.specialty}</p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-charcoal">
            <Icon name={modeIcon[appt.mode]} size={15} className="text-mute" />
            {appt.mode} · {appt.date} · {appt.time}
          </p>
          <p className="mt-0.5 text-xs text-mute">{appt.reason}</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {actions ??
          (appt.status === "Upcoming" ? (
            <>
              <Button href={`/consultation/${appt.id}`} size="sm">
                Join
              </Button>
              <Button href={`/patient/doctors/${appt.doctorId}`} variant="light" size="sm">
                Details
              </Button>
            </>
          ) : appt.status === "Completed" ? (
            <>
              <Button href="/patient/prescriptions" variant="light" size="sm">
                Prescription
              </Button>
              <Button
                href={`/patient/book/${appt.doctorId}`}
                variant="ghost"
                size="sm"
              >
                Book again
              </Button>
            </>
          ) : null)}
      </div>
    </div>
  );
}
