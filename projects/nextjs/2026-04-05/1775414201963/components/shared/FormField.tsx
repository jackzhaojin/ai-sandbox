"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { HelpCircle, AlertCircle } from "lucide-react"

export interface FormFieldProps {
  /** Unique ID for the field */
  id?: string
  /** Field label */
  label?: string
  /** Whether the field is required */
  required?: boolean
  /** Help text displayed below the field */
  helpText?: string
  /** Error message */
  error?: string
  /** Children (form control) */
  children: React.ReactNode
  /** Additional CSS classes */
  className?: string
  /** Tooltip content for contextual help */
  tooltip?: string
  /** Whether to hide the label visually (still accessible to screen readers) */
  hideLabel?: boolean
}

/**
 * FormField - A wrapper component for form inputs with label, error, and help text
 * 
 * @example
 * <FormField
 *   label="Email Address"
 *   required
 *   helpText="We'll never share your email"
 *   error={errors.email?.message}
 * >
 *   <Input type="email" {...register("email")} />
 * </FormField>
 */
export function FormField({
  id,
  label,
  required = false,
  helpText,
  error,
  children,
  className,
  tooltip,
  hideLabel = false,
}: FormFieldProps) {
  const fieldId = id || React.useId()
  const errorId = `${fieldId}-error`
  const helpId = `${fieldId}-help`
  const labelId = `${fieldId}-label`

  const ariaDescribedBy = [
    error ? errorId : null,
    helpText && !error ? helpId : null,
  ].filter(Boolean).join(" ") || undefined

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <div className="flex items-center gap-2">
          <Label
            id={labelId}
            htmlFor={fieldId}
            className={cn(
              "text-sm font-medium",
              hideLabel && "sr-only",
              error && "text-error-600"
            )}
          >
            {label}
            {required && (
              <span className="ml-1 text-error-500" aria-hidden="true">
                *
              </span>
            )}
            {required && (
              <span className="sr-only"> (required)</span>
            )}
          </Label>
          
          {tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    aria-label={`More information about ${label}`}
                  >
                    <HelpCircle className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" align="center">
                  <p className="max-w-xs text-sm">{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      )}

      <div className="relative">
        {React.isValidElement(children) &&
          React.cloneElement(children as React.ReactElement, {
            id: fieldId,
            "aria-labelledby": label ? labelId : undefined,
            "aria-describedby": ariaDescribedBy,
            "aria-invalid": error ? true : undefined,
            "aria-required": required ? true : undefined,
          })}
      </div>

      {error && (
        <p
          id={errorId}
          className="flex items-center gap-1.5 text-sm font-medium text-error-600"
          role="alert"
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}

      {helpText && !error && (
        <p
          id={helpId}
          className="text-sm text-muted-foreground"
        >
          {helpText}
        </p>
      )}
    </div>
  )
}

export default FormField
