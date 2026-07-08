import { PatientShell } from "@/components/roleShells";
import { ChatClient } from "@/components/ChatClient";
import { getChatThreads } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getOrCreatePatientThread } from "@/lib/actions/data";

export const dynamic = "force-dynamic";

export default async function PatientMessages({
  searchParams,
}: {
  searchParams: Promise<{ doctor?: string }>;
}) {
  const { doctor } = await searchParams;
  const userId = await getUserId();

  // Opening from "Message doctor" — make sure the thread exists first.
  if (isSupabaseConfigured && doctor) {
    await getOrCreatePatientThread(doctor);
  }

  const threads = await getChatThreads("patient", { userId });

  return (
    <PatientShell>
      <div className="flex h-[calc(100dvh-7rem)] flex-col sm:h-[calc(100dvh-8rem)]">
        <ChatClient
          threads={threads}
          perspective="patient"
          initialDoctorId={doctor}
          configured={isSupabaseConfigured}
        />
      </div>
    </PatientShell>
  );
}
