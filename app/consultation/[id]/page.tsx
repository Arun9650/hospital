import { ConsultationRoom, type RoomUser } from "@/components/ConsultationRoom";
import { getSessionUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/* Shared consultation room. Patient and doctor open the SAME url
   (/consultation/<appointmentId>) and meet on the Supabase channel keyed by it. */
export default async function ConsultationRoomPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { id } = await params;
  const { mode: modeParam } = await searchParams;
  const mode: "Video" | "Audio" | "Chat" =
    modeParam === "Audio" || modeParam === "Chat" ? modeParam : "Video";
  const session = await getSessionUser();

  const role: RoomUser["role"] = session?.role === "doctor" ? "doctor" : "patient";
  const me: RoomUser = {
    role,
    name: session?.name ?? (role === "doctor" ? "Doctor" : "You"),
    initials: session?.initials ?? (role === "doctor" ? "DR" : "ME"),
    color: session?.color ?? "#0070d1",
  };

  const exitHref = role === "doctor" ? "/doctor/appointments" : "/patient/appointments";

  return (
    <ConsultationRoom roomId={id} me={me} exitHref={exitHref} configured={isSupabaseConfigured} mode={mode} />
  );
}
