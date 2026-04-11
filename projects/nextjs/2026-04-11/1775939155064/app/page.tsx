import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">B2B Postal Checkout</h1>
        <p className="text-center text-gray-600 mb-8">
          Business shipping made simple. Create and manage your shipments with ease.
        </p>
        <div className="flex justify-center">
          <Link
            href="/shipments/new"
            className="rounded-lg bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700 transition-colors"
          >
            Create New Shipment
          </Link>
        </div>
      </div>
    </main>
  )
}
