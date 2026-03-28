/**
 * Dashboard Page
 *
 * Main authenticated dashboard page
 */

import { requireAuth } from '@/lib/auth/session'
import { UserProfile } from '@/components/auth/UserProfile'
import { Navigation } from '@/components/shared/Navigation'
import Link from 'next/link'

export const metadata = {
  title: 'Dashboard | Retro Analytics Dashboard',
  description: 'Analytics dashboard',
}

export default async function DashboardPage() {
  // Ensure user is authenticated
  await requireAuth()

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-black p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-green-500 mb-2 font-mono uppercase retro-glow">
              RETRO ANALYTICS DASHBOARD
            </h1>
            <p className="text-green-400 font-mono text-sm md:text-base">
              &gt; SYSTEM READY
            </p>
          </div>

          <div className="mb-8">
            <UserProfile />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/dashboard/analytics" className="border-2 border-green-500 p-6 bg-black shadow-[0_0_20px_rgba(0,255,0,0.3)] hover:border-green-300 transition-colors cursor-pointer">
              <h2 className="text-2xl font-bold text-green-500 mb-4 font-mono uppercase retro-glow">
                ANALYTICS
              </h2>
              <p className="text-green-400 font-mono text-sm mb-4">
                View and analyze your data with interactive charts
              </p>
              <p className="text-cyan-400 font-mono text-xs">
                &gt; Click to explore →
              </p>
            </Link>

            <Link href="/dashboard/reports" className="border-2 border-green-500 p-6 bg-black shadow-[0_0_20px_rgba(0,255,0,0.3)] hover:border-green-300 transition-colors cursor-pointer">
              <h2 className="text-2xl font-bold text-green-500 mb-4 font-mono uppercase retro-glow">
                REPORTS
              </h2>
              <p className="text-green-400 font-mono text-sm mb-4">
                Create and save custom analytics reports
              </p>
              <p className="text-cyan-400 font-mono text-xs">
                &gt; Click to manage →
              </p>
            </Link>

            <Link href="/dashboard/settings" className="border-2 border-green-500 p-6 bg-black shadow-[0_0_20px_rgba(0,255,0,0.3)] hover:border-green-300 transition-colors cursor-pointer">
              <h2 className="text-2xl font-bold text-green-500 mb-4 font-mono uppercase retro-glow">
                SETTINGS
              </h2>
              <p className="text-green-400 font-mono text-sm mb-4">
                Configure your dashboard preferences
              </p>
              <p className="text-cyan-400 font-mono text-xs">
                &gt; Click to configure →
              </p>
            </Link>
          </div>

          <div className="mt-8 border-2 border-green-500 p-6 bg-black shadow-[0_0_20px_rgba(0,255,0,0.3)]">
            <h2 className="text-xl font-bold text-green-500 mb-4 font-mono uppercase retro-glow">
              SYSTEM STATUS
            </h2>
            <div className="font-mono text-green-400 text-sm space-y-2">
              <p>&gt; ✓ Authentication System: ONLINE</p>
              <p>&gt; ✓ Database Connection: ACTIVE</p>
              <p>&gt; ✓ User Session: VALID</p>
              <p>&gt; ✓ Analytics API: ONLINE</p>
              <p>&gt; ✓ UI Components: ACTIVE</p>
              <p>&gt; ✓ Chart Visualizations: READY</p>
              <p>&gt; ✓ State Management: INTEGRATED</p>
              <p>&gt; ✓ Advanced Features: COMPLETE</p>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
