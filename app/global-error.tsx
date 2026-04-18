'use client';

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-4">
          <div className="rounded-lg bg-white p-8 shadow-sm text-center max-w-md">
            <h2 className="text-lg font-semibold text-zinc-900 mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-zinc-500 mb-4">
              An unexpected error occurred. Please try again.
            </p>
            <button
              onClick={() => unstable_retry()}
              className="inline-flex items-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
