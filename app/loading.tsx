import { Spinner } from "@/components/ui";

// Root loading UI: shown via Suspense while any async server page streams in, so
// navigation never lands on a blank frozen screen.
export default function Loading() {
  return (
    <div
      className="flex min-h-[60vh] items-center justify-center text-mute"
      role="status"
      aria-label="Loading"
    >
      <Spinner size={28} />
    </div>
  );
}
