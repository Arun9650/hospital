import { PatientShell } from "@/components/roleShells";
import { ChatClient } from "@/components/ChatClient";
import { patientChatThreads } from "@/lib/data";

export default async function PatientMessages({
  searchParams,
}: {
  searchParams: Promise<{ doctor?: string }>;
}) {
  const { doctor } = await searchParams;
  return (
    <PatientShell>
      <div className="flex h-[calc(100vh-8rem)] flex-col">
        <ChatClient
          threads={patientChatThreads}
          perspective="patient"
          initialDoctorId={doctor}
        />
      </div>
    </PatientShell>
  );
}
