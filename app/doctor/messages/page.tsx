import { DoctorShell } from "@/components/roleShells";
import { ChatClient } from "@/components/ChatClient";
import { getChatThreads, getCurrentDoctor } from "@/lib/db";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export default async function DoctorMessages() {
  // Resolve the signed-in doctor so they see *their own* conversations, not a
  // hardcoded demo doctor's threads.
  const doctor = await getCurrentDoctor();
  const threads = doctor ? await getChatThreads("doctor", { doctorId: doctor.id }) : [];

  return (
    <DoctorShell>
      <div className="flex h-[calc(100dvh-7rem)] flex-col sm:h-[calc(100dvh-8rem)]">
        <ChatClient
          threads={threads}
          perspective="doctor"
          configured={isSupabaseConfigured}
        />
      </div>
    </DoctorShell>
  );
}
