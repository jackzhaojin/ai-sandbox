import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'B2B Postal Checkout',
  description: 'Business shipping made simple',
}

export const dynamic = 'force-dynamic'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        {children}
      </body>
    </html>
  )
}
