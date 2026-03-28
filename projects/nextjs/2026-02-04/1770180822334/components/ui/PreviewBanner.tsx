'use client'

import { Eye, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface PreviewBannerProps {
  siteSlug: string
  pageSlug: string
  version?: number
}

/**
 * Preview Mode Banner
 *
 * Displays at the top of preview pages to indicate preview mode.
 * Shows version info and provides link to exit preview.
 */
export default function PreviewBanner({ siteSlug, pageSlug, version }: PreviewBannerProps) {
  const router = useRouter()

  const handleExit = () => {
    // Navigate to published page
    router.push(`/sites/${siteSlug}/${pageSlug}`)
  }

  return (
    <div className="sticky top-0 z-50 bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <Eye className="h-5 w-5" />
            <div>
              <div className="font-semibold">Preview Mode</div>
              <div className="text-xs text-blue-200">
                {version ? `Viewing version ${version}` : 'Viewing current draft'}
              </div>
            </div>
          </div>

          <button
            onClick={handleExit}
            className="flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium hover:bg-blue-800 transition-colors"
            aria-label="Exit preview mode"
          >
            <X className="h-4 w-4" />
            <span className="hidden sm:inline">Exit Preview</span>
          </button>
        </div>
      </div>
    </div>
  )
}
