import { Wrench } from 'lucide-react'

interface MaintenancePageProps {
  siteName: string
  message?: string
}

/**
 * MaintenancePage - Displayed when site is in maintenance mode
 *
 * Shows a maintenance message to visitors.
 * Controlled by site settings (maintenance_mode_enabled).
 */
export default function MaintenancePage({
  siteName,
  message = 'We are currently performing scheduled maintenance. Please check back soon.',
}: MaintenancePageProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 mb-6">
          <Wrench className="h-8 w-8 text-yellow-600" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Under Maintenance
        </h1>

        <p className="text-lg text-gray-600 mb-2">
          {siteName}
        </p>

        <p className="text-gray-500">
          {message}
        </p>
      </div>
    </div>
  )
}
