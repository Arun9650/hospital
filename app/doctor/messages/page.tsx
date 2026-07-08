import { DoctorShell } from "@/components/roleShells";
import { ChatClient } from "@/components/ChatClient";
import { doctorChatThreads } from "@/lib/data";

export default function DoctorMessages() {
  return (
    <DoctorShell>
      <div className="flex h-[calc(100vh-8rem)] flex-col">
        <ChatClient threads={doctorChatThreads} perspective="doctor" />
      </div>
    </DoctorShell>
  );
}
