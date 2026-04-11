export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <main className="flex flex-col items-center gap-8">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">
          B2B Postal Checkout
        </h1>
        <p className="text-lg text-gray-600 text-center max-w-md">
          Initialize project complete. Next step: Create postal_v2 schema and core tables.
        </p>
        <div className="flex gap-4">
          <div className="px-4 py-2 bg-primary-50 text-primary-700 rounded-lg text-sm font-medium">
            Next.js 15 ✓
          </div>
          <div className="px-4 py-2 bg-primary-50 text-primary-700 rounded-lg text-sm font-medium">
            TypeScript Strict ✓
          </div>
          <div className="px-4 py-2 bg-primary-50 text-primary-700 rounded-lg text-sm font-medium">
            Tailwind CSS v4 ✓
          </div>
        </div>
      </main>
    </div>
  );
}
