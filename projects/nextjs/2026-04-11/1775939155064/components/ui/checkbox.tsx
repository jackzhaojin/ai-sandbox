"use client"

import * as React from "react"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  checked?: boolean
  onChange?: (checked: boolean) => void
  label?: React.ReactNode
  description?: string
  error?: string
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onChange, label, description, error, id, ...props }, ref) => {
    const checkboxId = id || React.useId()
    const descriptionId = description ? `${checkboxId}-description` : undefined
    const errorId = error ? `${checkboxId}-error` : undefined
    
    const describedBy = [descriptionId, errorId].filter(Boolean).join(" ") || undefined

    return (
      <div className={cn("flex items-start", className)}>
        <div className="flex items-center h-5">
          <input
            ref={ref}
            id={checkboxId}
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange?.(e.target.checked)}
            className="sr-only"
            aria-describedby={describedBy}
            aria-invalid={!!error}
            {...props}
          />
          <label
            htmlFor={checkboxId}
            className={cn(
              "flex items-center justify-center w-4 h-4 rounded border-2 transition-colors cursor-pointer",
              "focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2",
              checked
                ? "border-blue-600 bg-blue-600"
                : "border-gray-300 bg-white hover:border-gray-400",
              error && "border-red-500",
              props.disabled && "cursor-not-allowed opacity-50"
            )}
          >
            {checked && <Check className="h-3 w-3 text-white" aria-hidden="true" />}
          </label>
        </div>
        <div className="ml-2 text-sm">
          {label && (
            <label 
              htmlFor={checkboxId}
              className={cn(
                "font-medium text-gray-700 cursor-pointer",
                props.disabled && "cursor-not-allowed opacity-50"
              )}
            >
              {label}
            </label>
          )}
          {description && (
            <p id={descriptionId} className="text-gray-500">
              {description}
            </p>
          )}
          {error && (
            <p id={errorId} className="text-red-600 mt-1" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
