import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-2xl mx-auto p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to PageForge CMS
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          An AEM-inspired visual page builder built with Next.js 15, TypeScript, and Tailwind CSS v4
        </p>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/login"
              className="block p-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <h2 className="text-xl font-semibold mb-2">Login</h2>
              <p className="text-sm">Access the CMS dashboard</p>
            </Link>

            <Link
              href="/sites"
              className="block p-6 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <h2 className="text-xl font-semibold mb-2">Dashboard</h2>
              <p className="text-sm">Manage sites and pages</p>
            </Link>
          </div>
        </div>

        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Project Status</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>✅ Step 1: Research and architecture (Complete)</li>
            <li>✅ Step 2: Next.js 15 + Tailwind v4 setup (Complete)</li>
            <li>⏳ Step 3-31: Coming soon...</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
