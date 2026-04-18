export default function Loading() {
  return (
    <div className="min-h-full bg-zinc-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        {/* Header skeleton */}
        <div className="mb-8 flex items-center justify-between">
          <div className="h-8 w-56 rounded bg-zinc-200 animate-pulse" />
          <div className="h-4 w-28 rounded bg-zinc-200 animate-pulse" />
        </div>

        {/* Table skeleton */}
        <div className="rounded-lg bg-white shadow-sm overflow-hidden animate-pulse">
          <div className="bg-zinc-50 px-6 py-3">
            <div className="flex justify-between">
              <div className="h-4 w-20 rounded bg-zinc-200" />
              <div className="h-4 w-12 rounded bg-zinc-200" />
            </div>
          </div>
          <div className="divide-y divide-zinc-100">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-6 py-4"
              >
                <div className="h-5 w-20 rounded-full bg-zinc-200" />
                <div className="h-4 w-16 rounded bg-zinc-200" />
              </div>
            ))}
          </div>
          <div className="bg-zinc-50 px-6 py-4">
            <div className="flex justify-between">
              <div className="h-4 w-24 rounded bg-zinc-200" />
              <div className="h-4 w-16 rounded bg-zinc-200" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
