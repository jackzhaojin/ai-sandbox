import type { Metadata, Viewport } from "next"
import { Geist } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import { SkipLink } from "@/components/shared/SkipLink"
import { AccessibilityProvider } from "@/components/accessibility/AccessibilityProvider"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: {
    default: "B2B Postal Checkout",
    template: "%s | B2B Postal Checkout",
  },
  description: "Business-to-business postal services checkout flow",
  keywords: ["shipping", "B2B", "postal", "logistics", "checkout"],
  authors: [{ name: "B2B Shipping" }],
  creator: "B2B Shipping",
  metadataBase: new URL("http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "B2B Postal Checkout",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
  width: "device-width",
  initialScale: 1,
}

/**
 * Root Layout - Application wrapper with accessibility enhancements
 * 
 * WCAG 2.1 AA Features:
 * - SkipLink: Allows keyboard users to bypass repetitive navigation
 * - AccessibilityProvider: Manages ARIA live regions for announcements
 * - Proper lang attribute for document language
 * - Semantic HTML structure with landmarks
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} antialiased`}>
      <body className="min-h-screen bg-background font-sans text-foreground">
        <AccessibilityProvider>
          {/* Skip Link - First focusable element for keyboard users */}
          <SkipLink targetId="main-content">
            Skip to main content
          </SkipLink>
          <SkipLink targetId="navigation">
            Skip to navigation
          </SkipLink>
          
          {children}
          <Toaster />
        </AccessibilityProvider>
      </body>
    </html>
  )
}
