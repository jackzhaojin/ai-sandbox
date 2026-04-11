'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  ArrowLeft,
  HelpCircle,
  Save,
  Menu,
  X,
  Package,
} from 'lucide-react'

interface HeaderProps {
  showBackButton?: boolean
  backHref?: string
  onSaveDraft?: () => void
  shipmentId?: string
}

export function Header({
  showBackButton = true,
  backHref = '/',
  onSaveDraft,
  shipmentId,
}: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left section: Back button and Logo */}
          <div className="flex items-center gap-4">
            {showBackButton && (
              <Link
                href={backHref}
                className="p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
            )}
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-900 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg hidden sm:block">
                B2B Shipping
              </span>
            </Link>
          </div>

          {/* Desktop: Action buttons */}
          <div className="hidden md:flex items-center gap-3">
            {onSaveDraft && (
              <button
                onClick={onSaveDraft}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Save className="w-4 h-4" />
                Save Draft
              </button>
            )}
            <Link
              href="/help"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
              Help
            </Link>
          </div>

          {/* Mobile: Hamburger menu */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        <div
          className={cn(
            'md:hidden overflow-hidden transition-all duration-200',
            isMobileMenuOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
          )}
        >
          <div className="py-3 border-t border-gray-100 space-y-2">
            {onSaveDraft && (
              <button
                onClick={() => {
                  onSaveDraft()
                  setIsMobileMenuOpen(false)
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Save className="w-4 h-4" />
                Save Draft
              </button>
            )}
            <Link
              href="/help"
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <HelpCircle className="w-4 h-4" />
              Help
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
