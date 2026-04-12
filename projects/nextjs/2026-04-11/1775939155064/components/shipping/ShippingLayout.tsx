'use client'

import { StepProvider } from '@/contexts/StepContext'
import { Header } from './Header'
import { Footer } from './Footer'
import { StepIndicator } from '@/components/shared/StepIndicator'
import { Navigation } from './Navigation'

interface ShippingLayoutProps {
  children: React.ReactNode
  step: number
  shipmentId?: string
  showStepIndicator?: boolean
  showNavigation?: boolean
  showFooter?: boolean
  headerProps?: {
    showBackButton?: boolean
    backHref?: string
    onSaveDraft?: () => void
    isSavingDraft?: boolean
  }
  navigationProps?: {
    onNext?: () => void | Promise<void>
    onPrevious?: () => void
    nextLabel?: string
    previousLabel?: string
    isNextLoading?: boolean
    isNextDisabled?: boolean
    showPrevious?: boolean
  }
}

export function ShippingLayout({
  children,
  step,
  shipmentId,
  showStepIndicator = true,
  showNavigation = true,
  showFooter = true,
  headerProps = {},
  navigationProps = {},
}: ShippingLayoutProps) {
  return (
    <StepProvider>
      <div className="min-h-screen flex flex-col bg-gray-50">
        {/* Header */}
        <Header
          showBackButton={headerProps.showBackButton ?? true}
          backHref={headerProps.backHref ?? '/'}
          onSaveDraft={headerProps.onSaveDraft}
          isSavingDraft={headerProps.isSavingDraft}
          shipmentId={shipmentId}
        />

        {/* Main content area */}
        <div className="flex-1 flex flex-col">
          {/* Step indicator */}
          {showStepIndicator && (
            <div className="bg-white border-b border-gray-200">
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <StepIndicator shipmentId={shipmentId} />
              </div>
            </div>
          )}

          {/* Page content */}
          <main className="flex-1">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </div>
          </main>

          {/* Navigation */}
          {showNavigation && (
            <Navigation
              shipmentId={shipmentId}
              {...navigationProps}
            />
          )}
        </div>

        {/* Footer */}
        {showFooter && <Footer />}
      </div>
    </StepProvider>
  )
}
