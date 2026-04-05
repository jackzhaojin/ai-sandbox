"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { HelpCircle, X, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface ContextualHelpProps {
  /** Help content (can be simple text or React nodes) */
  content: React.ReactNode
  /** Title for expanded help (optional) */
  title?: string
  /** Tooltip placement */
  side?: "top" | "right" | "bottom" | "left"
  /** Additional CSS classes */
  className?: string
  /** Trigger element (defaults to help icon) */
  children?: React.ReactNode
  /** Whether to show as a dialog instead of tooltip for larger content */
  useDialog?: boolean
  /** Icon size */
  iconSize?: "sm" | "md" | "lg"
}

/**
 * ContextualHelp - Provides contextual help via tooltip or dialog
 * 
 * @example
 * <ContextualHelp content="Enter your tracking number to find your shipment">
 *   <span>Tracking Number</span>
 * </ContextualHelp>
 * 
 * <ContextualHelp
 *   title="Understanding Shipping Rates"
 *   content={<ShippingRatesHelp />}
 *   useDialog
 * />
 */
export function ContextualHelp({
  content,
  title,
  side = "top",
  className,
  children,
  useDialog = false,
  iconSize = "md",
}: ContextualHelpProps) {
  const iconSizes = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  }

  if (useDialog) {
    return (
      <Dialog>
        <DialogTrigger>
          <button
            type="button"
            className={cn(
              "inline-flex items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              className
            )}
            aria-label={title ? `Learn more about ${title}` : "Get help"}
          >
            {children || <HelpCircle className={iconSizes[iconSize]} />}
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{title || "Help"}</DialogTitle>
            {typeof content === "string" ? (
              <DialogDescription>{content}</DialogDescription>
            ) : (
              <div className="text-muted-foreground">{content}</div>
            )}
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              className
            )}
            aria-label="More information"
          >
            {children || <HelpCircle className={iconSizes[iconSize]} />}
          </button>
        </TooltipTrigger>
        <TooltipContent
          side={side}
          align="center"
          className="max-w-xs"
        >
          {typeof content === "string" ? (
            <p className="text-sm">{content}</p>
          ) : (
            content
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/**
 * HelpPanel - A slide-out panel for extended help content
 */
export interface HelpPanelProps {
  /** Whether the panel is open */
  isOpen: boolean
  /** Callback when panel closes */
  onClose: () => void
  /** Panel title */
  title: string
  /** Panel content */
  children: React.ReactNode
  /** Additional CSS classes */
  className?: string
}

export function HelpPanel({
  isOpen,
  onClose,
  title,
  children,
  className,
}: HelpPanelProps) {
  // Close on escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }

    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [isOpen, onClose])

  // Prevent body scroll when open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-modal bg-black/50 backdrop-blur-sm transition-opacity duration-300",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Panel */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-modal w-full max-w-md transform bg-background shadow-2xl transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full",
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-panel-title"
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-6 py-4">
            <h2
              id="help-panel-title"
              className="text-lg font-semibold"
            >
              {title}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Close help panel"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {children}
          </div>
        </div>
      </div>
    </>
  )
}

/**
 * HelpTopic - A clickable help topic that expands
 */
export interface HelpTopicProps {
  /** Topic title */
  title: string
  /** Topic content */
  children: React.ReactNode
  /** Whether the topic is expanded by default */
  defaultExpanded?: boolean
  /** Additional CSS classes */
  className?: string
}

export function HelpTopic({
  title,
  children,
  defaultExpanded = false,
  className,
}: HelpTopicProps) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded)

  return (
    <div className={cn("border-b last:border-b-0", className)}>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between py-3 text-left font-medium transition-colors hover:text-primary"
        aria-expanded={isExpanded}
      >
        <span>{title}</span>
        <ChevronRight
          className={cn(
            "h-4 w-4 transition-transform duration-200",
            isExpanded && "rotate-90"
          )}
          aria-hidden="true"
        />
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          isExpanded ? "max-h-96 pb-4" : "max-h-0"
        )}
      >
        <div className="text-sm text-muted-foreground">
          {children}
        </div>
      </div>
    </div>
  )
}

export default ContextualHelp
