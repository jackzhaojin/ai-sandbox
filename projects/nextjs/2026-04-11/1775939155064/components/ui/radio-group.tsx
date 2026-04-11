"use client"

import * as React from "react"
import { Circle } from "lucide-react"

import { cn } from "@/lib/utils"

interface RadioGroupProps {
  value?: string
  onChange?: (value: string) => void
  children: React.ReactNode
  className?: string
  name?: string
}

const RadioGroupContext = React.createContext<{
  value?: string
  onChange?: (value: string) => void
  name?: string
}>({})

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ value, onChange, children, className, name, ...props }, ref) => {
    return (
      <RadioGroupContext.Provider value={{ value, onChange, name }}>
        <div
          ref={ref}
          className={cn("grid gap-2", className)}
          role="radiogroup"
          {...props}
        >
          {children}
        </div>
      </RadioGroupContext.Provider>
    )
  }
)
RadioGroup.displayName = "RadioGroup"

interface RadioGroupItemProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string
  id?: string
  label?: React.ReactNode
}

const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ className, value, id, label, ...props }, ref) => {
    const context = React.useContext(RadioGroupContext)
    const isChecked = context.value === value
    const itemId = id || `${context.name || 'radio'}-${value}`

    return (
      <label
        htmlFor={itemId}
        className={cn(
          "flex items-center space-x-2 cursor-pointer",
          props.disabled && "cursor-not-allowed opacity-50",
          className
        )}
      >
        <input
          ref={ref}
          id={itemId}
          type="radio"
          name={context.name}
          value={value}
          checked={isChecked}
          onChange={() => context.onChange?.(value)}
          className="sr-only"
          {...props}
        />
        <div
          className={cn(
            "h-4 w-4 rounded-full border-2 flex items-center justify-center transition-colors",
            isChecked
              ? "border-blue-600 bg-blue-600"
              : "border-gray-300 bg-white hover:border-gray-400"
          )}
        >
          {isChecked && <Circle className="h-2 w-2 fill-white text-white" />}
        </div>
        {label && <span className="text-sm text-gray-700">{label}</span>}
      </label>
    )
  }
)
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem }
