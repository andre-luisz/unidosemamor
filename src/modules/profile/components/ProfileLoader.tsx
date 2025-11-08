'use client';

export default function ProfileLoader() {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="space-y-3">
        <div className="h-7 w-48 rounded-md bg-muted animate-pulse" />
        <div className="h-4 w-80 rounded-md bg-muted animate-pulse" />
      </div>

      <div className="rounded-2xl border p-4 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 rounded bg-muted animate-pulse" />
              <div className="h-10 w-full rounded bg-muted animate-pulse" />
            </div>
          ))}
        </div>
        <div className="h-10 w-40 rounded bg-muted animate-pulse" />
      </div>
    </div>
  );
}
