import { PatientShell } from "@/components/roleShells";
import { PageHeader } from "@/components/DashboardShell";
import { ChatClient } from "@/components/ChatClient";
import { getChatThreads } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function PatientMessages({
  searchParams,
}: {
  searchParams: Promise<{ doctor?: string }>;
}) {
  const { doctor } = await searchParams;
  const userId = await getUserId();
  const threads = await getChatThreads("patient", { userId });

  return (
    <PatientShell>
      <PageHeader title="Messages" subtitle="Chat with your doctors." />
      {/* Bounded height so the chat's internal panes scroll instead of the page. */}
      <div className="flex h-[calc(100vh-13rem)] min-h-[440px] flex-col">
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
