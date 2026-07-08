import { DoctorShell } from "@/components/roleShells";
import { ChatClient } from "@/components/ChatClient";
import { getChatThreads } from "@/lib/db";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

// The doctor portal is demoed as Dr. Anaya Rao (mirrors DoctorShell).
const DOCTOR_ID = "dr-anaya-rao";

export default async function DoctorMessages() {
  const threads = await getChatThreads("doctor", { doctorId: DOCTOR_ID });

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
