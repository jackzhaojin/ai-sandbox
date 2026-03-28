'use client';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <h2>Something went wrong!</h2>
          <button onClick={reset} style={{ padding: '10px 20px', marginTop: '20px', cursor: 'pointer' }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
