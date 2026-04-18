export default function Loading() {
  return (
    <div className="min-h-full bg-zinc-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        {/* Header skeleton */}
        <div className="mb-8 flex items-center justify-between">
          <div className="h-8 w-32 rounded bg-zinc-200 animate-pulse" />
          <div className="flex items-center gap-3">
            <div className="h-4 w-16 rounded bg-zinc-200 animate-pulse" />
            <div className="h-8 w-24 rounded bg-zinc-200 animate-pulse" />
          </div>
        </div>

        {/* Month group skeletons */}
        {Array.from({ length: 2 }).map((_, gi) => (
          <div
            key={gi}
            className="mb-6 rounded-lg bg-white p-6 shadow-sm animate-pulse"
          >
            <div className="mb-4 h-5 w-40 rounded bg-zinc-200" />
            <div className="divide-y divide-zinc-100">
              {Array.from({ length: 3 }).map((_, li) => (
                <div
                  key={li}
                  className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="h-4 w-14 rounded bg-zinc-200" />
                    <div className="h-5 w-20 rounded-full bg-zinc-200" />
                    <div className="h-4 w-32 rounded bg-zinc-200" />
                  </div>
                  <div className="h-4 w-16 rounded bg-zinc-200" />
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end border-t border-zinc-100 pt-4">
              <div className="h-4 w-28 rounded bg-zinc-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
