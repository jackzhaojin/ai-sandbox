/**
 * Analytics Dashboard Page
 *
 * Displays analytics metrics, charts, and recent events
 */

import { requireAuth } from '@/lib/auth/session'
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard'
import { Navigation } from '@/components/shared/Navigation'

export const metadata = {
  title: 'Analytics | Retro Analytics Dashboard',
  description: 'View analytics metrics and insights',
}

export default async function AnalyticsPage() {
  // Ensure user is authenticated
  await requireAuth()

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-black p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-green-500 mb-2 font-mono uppercase retro-glow">
            ANALYTICS DASHBOARD
          </h1>
          <p className="text-green-400 font-mono text-sm md:text-base">
            &gt; REAL-TIME METRICS AND INSIGHTS
          </p>
        </div>

        <AnalyticsDashboard />
      </div>
    </main>
    </>
  )
}
