"use client"

import * as React from "react"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  checked?: boolean
  onChange?: (checked: boolean) => void
  label?: React.ReactNode
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onChange, label, id, ...props }, ref) => {
    const checkboxId = id || React.useId()

    return (
      <label
        htmlFor={checkboxId}
        className={cn(
          "flex items-center space-x-2 cursor-pointer",
          props.disabled && "cursor-not-allowed opacity-50",
          className
        )}
      >
        <input
          ref={ref}
          id={checkboxId}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange?.(e.target.checked)}
          className="sr-only"
          {...props}
        />
        <div
          className={cn(
            "h-4 w-4 rounded border-2 flex items-center justify-center transition-colors",
            checked
              ? "border-blue-600 bg-blue-600"
              : "border-gray-300 bg-white hover:border-gray-400"
          )}
        >
          {checked && <Check className="h-3 w-3 text-white" />}
        </div>
        {label && <span className="text-sm text-gray-700">{label}</span>}
      </label>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
