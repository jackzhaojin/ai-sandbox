"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Header, type NavItem } from "./Header"
import { Footer } from "./Footer"
import { ProgressIndicator, type Step } from "@/components/shared/ProgressIndicator"

export interface ShippingLayoutProps {
  /** Page content */
  children: React.ReactNode
  /** Page title */
  title?: string
  /** Page description */
  description?: string
  /** Checkout steps for progress indicator */
  steps?: Step[]
  /** Current step ID */
  currentStep?: string
  /** Completed step IDs */
  completedSteps?: string[]
  /** Whether to show progress indicator */
  showProgress?: boolean
  /** Header navigation items */
  navItems?: NavItem[]
  /** User information */
  userInfo?: {
    name?: string
    email?: string
    organizationName?: string
  }
  /** Header props */
  headerProps?: Omit<React.ComponentProps<typeof Header>, "navItems">
  /** Footer props */
  footerProps?: Omit<React.ComponentProps<typeof Footer>, "minimal">
  /** Whether to use minimal footer */
  minimalFooter?: boolean
  /** Additional CSS classes */
  className?: string
  /** Main content CSS classes */
  contentClassName?: string
  /** Whether to use full width layout */
  fullWidth?: boolean
}

/**
 * ShippingLayout - Master layout wrapper for shipping/checkout pages
 * 
 * Combines Header, Footer, and optional ProgressIndicator for checkout flows.
 * 
 * @example
 * <ShippingLayout
 *   title="Sender Information"
 *   steps={checkoutSteps}
 *   currentStep="sender"
 *   completedSteps={[]}
 *   showProgress
 * >
 *   <SenderForm />
 * </ShippingLayout>
 */
export function ShippingLayout({
  children,
  title,
  description,
  steps,
  currentStep,
  completedSteps = [],
  showProgress = false,
  navItems,
  userInfo,
  headerProps,
  footerProps,
  minimalFooter = true,
  className,
  contentClassName,
  fullWidth = false,
}: ShippingLayoutProps) {
  return (
    <div className={cn("flex min-h-screen flex-col", className)}>
      {/* Header */}
      <Header
        navItems={navItems}
        userName={userInfo?.name}
        userEmail={userInfo?.email}
        organizationName={userInfo?.organizationName}
        {...headerProps}
      />

      {/* Progress Indicator */}
      {showProgress && steps && currentStep && (
        <div className="border-b bg-background">
          <div className={cn(
            "mx-auto px-4 py-4 sm:px-6 lg:px-8",
            fullWidth ? "w-full" : "container max-w-5xl"
          )}>
            {/* Desktop: Horizontal Steps */}
            <div className="hidden md:block">
              <ProgressIndicator
                steps={steps}
                currentStep={currentStep}
                completedSteps={completedSteps}
                orientation="horizontal"
                size="md"
              />
            </div>
            
            {/* Mobile: Compact Progress */}
            <div className="md:hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    Step {steps.findIndex(s => s.id === currentStep) + 1} of {steps.length}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    — {steps.find(s => s.id === currentStep)?.label}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {Math.round(((steps.findIndex(s => s.id === currentStep) + 1) / steps.length) * 100)}%
                </div>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{
                    width: `${((steps.findIndex(s => s.id === currentStep) + 1) / steps.length) * 100}%`
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Page Title */}
      {(title || description) && (
        <div className="border-b bg-muted/30">
          <div className={cn(
            "mx-auto px-4 py-6 sm:px-6 lg:px-8",
            fullWidth ? "w-full" : "container max-w-5xl"
          )}>
            {title && (
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {title}
              </h1>
            )}
            {description && (
              <p className="mt-2 text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main
        className={cn(
          "flex-1",
          fullWidth ? "w-full" : "container mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8",
          contentClassName
        )}
        role="main"
        aria-label={title || "Page content"}
      >
        {children}
      </main>

      {/* Footer */}
      <Footer minimal={minimalFooter} {...footerProps} />
    </div>
  )
}

/**
 * CheckoutLayout - Specialized layout for checkout flow
 */
export interface CheckoutLayoutProps extends Omit<ShippingLayoutProps, "showProgress"> {
  /** Checkout steps */
  steps: Step[]
  /** Current step ID */
  currentStep: string
  /** Sidebar content (order summary, etc.) */
  sidebar?: React.ReactNode
  /** Whether sidebar should be shown */
  showSidebar?: boolean
}

export function CheckoutLayout({
  steps,
  currentStep,
  sidebar,
  showSidebar = false,
  children,
  ...props
}: CheckoutLayoutProps) {
  const currentStepIndex = steps.findIndex(s => s.id === currentStep)
  const completedSteps = steps
    .slice(0, currentStepIndex)
    .map(s => s.id)

  return (
    <ShippingLayout
      steps={steps}
      currentStep={currentStep}
      completedSteps={completedSteps}
      showProgress
      minimalFooter
      {...props}
    >
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className={cn("space-y-6", showSidebar && "lg:col-span-2")}>
          {children}
        </div>

        {/* Sidebar */}
        {showSidebar && sidebar && (
          <aside className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {sidebar}
            </div>
          </aside>
        )}
      </div>
    </ShippingLayout>
  )
}

export default ShippingLayout
