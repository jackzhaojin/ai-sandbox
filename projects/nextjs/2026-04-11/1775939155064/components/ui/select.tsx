"use client"

import * as React from "react"
import { Check, ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

const Select = SelectPrimitive

function SelectPrimitive({
  children,
  value,
  onChange,
  disabled,
}: {
  children: React.ReactNode
  value?: string
  onChange?: (value: string) => void
  disabled?: boolean
}) {
  const [isOpen, setIsOpen] = React.useState(false)
  const selectRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSelect = (selectedValue: string) => {
    onChange?.(selectedValue)
    setIsOpen(false)
  }

  return (
    <div ref={selectRef} className="relative">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === SelectTrigger) {
          return React.cloneElement(child as React.ReactElement<SelectTriggerProps>, {
            onClick: () => !disabled && setIsOpen(!isOpen),
            isOpen,
            value,
            disabled,
          })
        }
        if (React.isValidElement(child) && child.type === SelectContent) {
          return isOpen
            ? React.cloneElement(child as React.ReactElement<SelectContentProps>, {
                onSelect: handleSelect,
                value,
              })
            : null
        }
        return null
      })}
    </div>
  )
}

interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isOpen?: boolean
  placeholder?: string
}

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, isOpen, placeholder, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "flex h-11 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-base ring-offset-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:h-10 md:text-sm",
        className
      )}
      {...props}
    >
      <span className={!children ? "text-gray-400" : ""}>
        {children || placeholder}
      </span>
      <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform", isOpen && "rotate-180")} />
    </button>
  )
)
SelectTrigger.displayName = "SelectTrigger"

interface SelectValueProps {
  placeholder?: string
}

const SelectValue: React.FC<SelectValueProps> = ({ placeholder }) => {
  return <>{placeholder}</>
}

interface SelectContentProps {
  children: React.ReactNode
  className?: string
  onSelect?: (value: string) => void
  value?: string
}

const SelectContent = React.forwardRef<HTMLDivElement, SelectContentProps>(
  ({ className, children, onSelect, value }, ref) => (
    <div
      ref={ref}
      className={cn(
        "absolute z-50 w-full rounded-md border border-gray-200 bg-white shadow-lg mt-1 max-h-60 overflow-auto",
        className
      )}
    >
      <div className="p-1">
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child) && child.type === SelectItem) {
            return React.cloneElement(child as React.ReactElement<SelectItemProps>, {
              onSelect,
              isSelected: child.props.value === value,
            })
          }
          return child
        })}
      </div>
    </div>
  )
)
SelectContent.displayName = "SelectContent"

interface SelectItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
  children: React.ReactNode
  onSelect?: (value: string) => void
  isSelected?: boolean
}

const SelectItem = React.forwardRef<HTMLButtonElement, SelectItemProps>(
  ({ className, children, value, onSelect, isSelected, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 pl-8 pr-2 text-base outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100 min-h-[44px] md:text-sm md:py-1.5",
        isSelected && "bg-gray-100",
        className
      )}
      onClick={() => onSelect?.(value)}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {isSelected && <Check className="h-4 w-4" />}
      </span>
      {children}
    </button>
  )
)
SelectItem.displayName = "SelectItem"

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }
