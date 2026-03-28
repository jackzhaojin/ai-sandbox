'use client'

import { AlertCircle, Power } from 'lucide-react'

interface ErrorPages {
  404?: {
    title?: string
    message?: string
    pageId?: string
  }
  500?: {
    title?: string
    message?: string
    pageId?: string
  }
  maintenanceMode?: {
    enabled?: boolean
    title?: string
    message?: string
  }
}

interface ErrorPagesTabProps {
  errorPages: ErrorPages
  onChange: (field: string, value: any) => void
}

export function ErrorPagesTab({ errorPages, onChange }: ErrorPagesTabProps) {
  const config = {
    404: {
      title: errorPages['404']?.title || 'Page Not Found',
      message: errorPages['404']?.message || 'The page you are looking for does not exist.',
      pageId: errorPages['404']?.pageId || '',
    },
    500: {
      title: errorPages['500']?.title || 'Server Error',
      message: errorPages['500']?.message || 'Something went wrong. Please try again later.',
      pageId: errorPages['500']?.pageId || '',
    },
    maintenanceMode: {
      enabled: errorPages.maintenanceMode?.enabled || false,
      title: errorPages.maintenanceMode?.title || 'Site Under Maintenance',
      message: errorPages.maintenanceMode?.message || 'We are currently performing scheduled maintenance. Please check back soon.',
    },
  }

  const updateErrorPage = (errorCode: string, field: string, value: any) => {
    onChange('errorPages', {
      ...errorPages,
      [errorCode]: {
        ...errorPages[errorCode as keyof ErrorPages],
        [field]: value,
      },
    })
  }

  const updateMaintenanceMode = (field: string, value: any) => {
    onChange('errorPages', {
      ...errorPages,
      maintenanceMode: {
        ...errorPages.maintenanceMode,
        [field]: value,
      },
    })
  }

  return (
    <div className="space-y-8">
      {/* Maintenance Mode */}
      <div className="rounded-lg border-2 border-amber-200 bg-amber-50 p-6">
        <div className="mb-4 flex items-center gap-3">
          <Power className="h-6 w-6 text-amber-600" />
          <h3 className="text-lg font-semibold text-amber-900">Maintenance Mode</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="maintenanceMode"
              checked={config.maintenanceMode.enabled}
              onChange={(e) => updateMaintenanceMode('enabled', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
            />
            <label htmlFor="maintenanceMode" className="ml-2 block text-sm font-medium text-amber-900">
              Enable Maintenance Mode
            </label>
          </div>

          {config.maintenanceMode.enabled && (
            <div className="ml-6 space-y-3 rounded-lg border border-amber-300 bg-white p-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Title
                </label>
                <input
                  type="text"
                  value={config.maintenanceMode.title}
                  onChange={(e) => updateMaintenanceMode('title', e.target.value)}
                  placeholder="Site Under Maintenance"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Message
                </label>
                <textarea
                  value={config.maintenanceMode.message}
                  onChange={(e) => updateMaintenanceMode('message', e.target.value)}
                  placeholder="We are currently performing scheduled maintenance..."
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-amber-700">
                <AlertCircle className="h-4 w-4" />
                <span>When enabled, all visitors will see this maintenance page</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 404 Error Page */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">404 - Page Not Found</h3>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              type="text"
              value={config['404'].title}
              onChange={(e) => updateErrorPage('404', 'title', e.target.value)}
              placeholder="Page Not Found"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Message
            </label>
            <textarea
              value={config['404'].message}
              onChange={(e) => updateErrorPage('404', 'message', e.target.value)}
              placeholder="The page you are looking for does not exist."
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Custom Page ID (Optional)
            </label>
            <input
              type="text"
              value={config['404'].pageId}
              onChange={(e) => updateErrorPage('404', 'pageId', e.target.value)}
              placeholder="Leave empty to use default error page"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            <p className="mt-1 text-xs text-gray-500">
              Select an existing page to use as the 404 error page
            </p>
          </div>
        </div>
      </div>

      {/* 500 Error Page */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">500 - Server Error</h3>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              type="text"
              value={config['500'].title}
              onChange={(e) => updateErrorPage('500', 'title', e.target.value)}
              placeholder="Server Error"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Message
            </label>
            <textarea
              value={config['500'].message}
              onChange={(e) => updateErrorPage('500', 'message', e.target.value)}
              placeholder="Something went wrong. Please try again later."
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Custom Page ID (Optional)
            </label>
            <input
              type="text"
              value={config['500'].pageId}
              onChange={(e) => updateErrorPage('500', 'pageId', e.target.value)}
              placeholder="Leave empty to use default error page"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            <p className="mt-1 text-xs text-gray-500">
              Select an existing page to use as the 500 error page
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
