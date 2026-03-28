import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { FileQuestion } from 'lucide-react'
import { ComponentRenderer, resolveFragments } from '@/lib/server-component-renderer'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * Custom 404 Not Found Page
 *
 * Behavior:
 * 1. Check if site has custom error_pages.notFound.pageId configured
 * 2. If yes, render that page with site header/footer
 * 3. If no, render default 404 message with site header/footer
 */
export default async function NotFound() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Try to get siteSlug from URL (this is tricky in not-found.tsx)
  // For now, render a generic 404 page
  // In production, you'd want to extract siteSlug from the request URL

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-200 mb-6">
          <FileQuestion className="h-8 w-8 text-gray-600" />
        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          404
        </h1>

        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          Page Not Found
        </h2>

        <p className="text-gray-600 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <Link
          href="/"
          className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  )
}
