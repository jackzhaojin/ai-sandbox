import type { Metadata, Viewport } from 'next'
import './globals.css'
import { LiveRegionProvider } from '@/lib/accessibility'
import { ErrorBoundary } from '@/components/error'

export const metadata: Metadata = {
  title: 'B2B Postal Checkout',
  description: 'Business shipping made simple',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#2563eb',
}

export const dynamic = 'force-dynamic'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 antialiased">
        {/* Skip link for keyboard navigation */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md focus:shadow-lg focus:font-medium focus:text-sm"
        >
          Skip to main content
        </a>
        
        {/* Live region provider for screen reader announcements */}
        <LiveRegionProvider>
          <ErrorBoundary>
            <main id="main-content" className="min-h-screen" tabIndex={-1}>
              {children}
            </main>
          </ErrorBoundary>
        </LiveRegionProvider>
      </body>
    </html>
  )
}
