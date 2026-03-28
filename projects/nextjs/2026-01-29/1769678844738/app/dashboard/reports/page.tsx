/**
 * Reports Management Page
 *
 * List, create, edit, and delete saved reports
 */

import { requireAuth } from '@/lib/auth/session'
import { ReportsManager } from '@/components/reports/ReportsManager'
import { Navigation } from '@/components/shared/Navigation'

export const metadata = {
  title: 'Reports | Retro Analytics Dashboard',
  description: 'Manage your analytics reports',
}

export default async function ReportsPage() {
  // Ensure user is authenticated
  await requireAuth()

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-black p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-green-500 mb-2 font-mono uppercase retro-glow">
            REPORTS MANAGER
          </h1>
          <p className="text-green-400 font-mono text-sm md:text-base">
            &gt; CREATE AND MANAGE ANALYTICS REPORTS
          </p>
        </div>

        <ReportsManager />
      </div>
    </main>
    </>
  )
}
