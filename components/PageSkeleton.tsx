// Generic dashboard-content skeleton, shown by the per-section loading.tsx files
// while an async page streams in. Rendered inside the shell so the sidebar/frame
// stay put and navigation reads as "loading" instead of frozen.
export function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-6" role="status" aria-label="Loading page">
      <div className="h-8 w-56 rounded bg-black/10" />
      <div className="h-4 w-80 max-w-full rounded bg-black/5" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-black/5" />
        ))}
      </div>
      <div className="h-48 rounded-xl bg-black/5" />
    </div>
  );
}
