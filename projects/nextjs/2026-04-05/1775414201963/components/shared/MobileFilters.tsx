"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { SlidersHorizontal, X } from "lucide-react"

export interface MobileFiltersProps {
  /** Trigger button label */
  label?: string
  /** Filter content to render in sheet */
  children: React.ReactNode
  /** Additional CSS classes */
  className?: string
  /** Whether the sheet is open */
  open?: boolean
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void
  /** Sheet title */
  title?: string
  /** Number of active filters to show badge */
  activeFilterCount?: number
}

/**
 * MobileFilters - Sheet-based filter panel for mobile devices
 * 
 * Provides a slide-up drawer for filters on mobile, hidden on desktop.
 * 
 * @example
 * <MobileFilters label="Filters" activeFilterCount={2}>
 *   <FilterForm />
 * </MobileFilters>
 */
export function MobileFilters({
  label = "Filters",
  children,
  className,
  open,
  onOpenChange,
  title = "Filter Options",
  activeFilterCount = 0,
}: MobileFiltersProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  
  const isOpen = open ?? internalOpen
  const setIsOpen = onOpenChange ?? setInternalOpen

  return (
    <div className={cn("md:hidden", className)}>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant={activeFilterCount > 0 ? "default" : "outline"}
            size="sm"
            className="gap-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {label}
            {activeFilterCount > 0 && (
              <span className="ml-1 rounded-full bg-white/20 px-1.5 py-0.5 text-xs">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[85vh] sm:h-[75vh]">
          <SheetHeader className="pb-4 border-b">
            <SheetTitle className="flex items-center justify-between">
              {title}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </SheetTitle>
          </SheetHeader>
          <div className="py-4 overflow-y-auto max-h-[calc(85vh-5rem)]">
            {children}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

/**
 * MobileHelp - Sheet-based help panel for mobile devices
 * 
 * Provides a slide-up drawer for help content on mobile.
 * 
 * @example
 * <MobileHelp title="Help" triggerLabel="Need help?">
 *   <HelpContent />
 * </MobileHelp>
 */
export interface MobileHelpProps {
  /** Trigger button label */
  triggerLabel?: string
  /** Help content to render in sheet */
  children: React.ReactNode
  /** Additional CSS classes */
  className?: string
  /** Sheet title */
  title?: string
  /** Trigger button variant */
  variant?: "default" | "ghost" | "outline" | "link"
}

export function MobileHelp({
  triggerLabel = "Help",
  children,
  className,
  title = "Help & Information",
  variant = "ghost",
}: MobileHelpProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <div className={cn("md:hidden", className)}>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant={variant} size="sm">
            {triggerLabel}
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader className="pb-4 border-b">
            <SheetTitle>{title}</SheetTitle>
          </SheetHeader>
          <div className="py-4 overflow-y-auto max-h-[calc(80vh-4rem)]">
            {children}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

export default MobileFilters
