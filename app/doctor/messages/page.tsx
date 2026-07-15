import { DoctorShell } from "@/components/roleShells";
import { PageHeader } from "@/components/DashboardShell";
import { ChatClient } from "@/components/ChatClient";
import { getChatThreads, getCurrentDoctor } from "@/lib/db";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function DoctorMessages() {
  const doctor = await getCurrentDoctor();
  const threads = await getChatThreads("doctor", { doctorId: doctor?.id });

  return (
    <DoctorShell>
      <PageHeader title="Messages" subtitle="Chat with your patients." />
      {/* Bounded height so the chat's internal panes scroll instead of the page. */}
      <div className="flex h-[calc(100vh-13rem)] min-h-[440px] flex-col">
        <ChatClient threads={threads} perspective="doctor" configured={isSupabaseConfigured} />
      </div>
    </DoctorShell>
  );
}
