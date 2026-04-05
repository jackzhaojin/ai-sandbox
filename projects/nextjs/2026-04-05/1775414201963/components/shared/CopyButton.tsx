"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Check, Copy } from "lucide-react"

export interface CopyButtonProps {
  /** Text to copy to clipboard */
  text: string
  /** Button variant */
  variant?: "default" | "outline" | "ghost" | "secondary"
  /** Button size */
  size?: "default" | "sm" | "lg" | "icon"
  /** Additional CSS classes */
  className?: string
  /** Callback when copy is successful */
  onCopy?: () => void
  /** Custom success message duration in ms */
  successDuration?: number
  /** Aria label for the button */
  ariaLabel?: string
  /** Children to render inside button (overrides default icon) */
  children?: React.ReactNode
}

/**
 * CopyButton - A button that copies text to clipboard
 * 
 * Shows a checkmark briefly after successful copy.
 * 
 * @example
 * <CopyButton text="tracking-12345" variant="outline" size="sm" />
 * 
 * <CopyButton text="order-details">
 *   Copy Order Details
 * </CopyButton>
 */
export function CopyButton({
  text,
  variant = "ghost",
  size = "icon",
  className,
  onCopy,
  successDuration = 2000,
  ariaLabel = "Copy to clipboard",
  children,
}: CopyButtonProps) {
  const [hasCopied, setHasCopied] = React.useState(false)

  const handleCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text)
      setHasCopied(true)
      onCopy?.()
      
      setTimeout(() => {
        setHasCopied(false)
      }, successDuration)
    } catch (err) {
      console.error("Failed to copy text:", err)
    }
  }, [text, onCopy, successDuration])

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(
        "relative transition-all duration-200",
        hasCopied && "text-success-600",
        className
      )}
      onClick={handleCopy}
      aria-label={hasCopied ? "Copied!" : ariaLabel}
      aria-live="polite"
    >
      {children ? (
        <span className="flex items-center gap-2">
          {hasCopied ? (
            <Check className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Copy className="h-4 w-4" aria-hidden="true" />
          )}
          {children}
        </span>
      ) : (
        <span className="relative flex items-center justify-center">
          <Check
            className={cn(
              "h-4 w-4 absolute transition-all duration-200",
              hasCopied ? "opacity-100 scale-100" : "opacity-0 scale-50"
            )}
            aria-hidden="true"
          />
          <Copy
            className={cn(
              "h-4 w-4 transition-all duration-200",
              hasCopied ? "opacity-0 scale-50" : "opacity-100 scale-100"
            )}
            aria-hidden="true"
          />
        </span>
      )}
    </Button>
  )
}

export default CopyButton
