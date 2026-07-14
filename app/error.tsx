"use client";

import { Button } from "@/components/ui";

// Root error boundary: catches a thrown/rejected server or client component so a
// failure shows a recoverable message with a retry instead of an unhandled crash.
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h2 className="font-display text-2xl font-light tracking-tight">Something went wrong</h2>
      <p className="max-w-sm text-sm text-mute">
        We hit an unexpected error loading this page. Please try again.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
