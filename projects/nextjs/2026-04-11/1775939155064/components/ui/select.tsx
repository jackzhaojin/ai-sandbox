"use client"

import * as React from "react"
import { Check, ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

// ============================================================================
// Accessible Select Component with full ARIA support
// ============================================================================

interface SelectContextType {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  value?: string
  onChange?: (value: string) => void
  disabled?: boolean
  selectId: string
  listboxId: string
  activeDescendant?: string
  setActiveDescendant: (id: string) => void
}

const SelectContext = React.createContext<SelectContextType | null>(null)

function useSelect() {
  const context = React.useContext(SelectContext)
  if (!context) {
    throw new Error("Select components must be used within a Select")
  }
  return context
}

interface SelectProps {
  children: React.ReactNode
  value?: string
  onChange?: (value: string) => void
  disabled?: boolean
  "aria-label"?: string
  "aria-labelledby"?: string
  "aria-describedby"?: string
}

function Select({
  children,
  value,
  onChange,
  disabled,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
}: SelectProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [activeDescendant, setActiveDescendant] = React.useState<string>()
  const selectId = React.useId()
  const listboxId = `${selectId}-listbox`
  const selectRef = React.useRef<HTMLDivElement>(null)

  // Close on click outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Close on Escape key
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false)
        // Return focus to trigger
        const trigger = selectRef.current?.querySelector("[role='combobox']") as HTMLElement
        trigger?.focus()
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen])

  return (
    <SelectContext.Provider
      value={{
        isOpen,
        setIsOpen,
        value,
        onChange,
        disabled,
        selectId,
        listboxId,
        activeDescendant,
        setActiveDescendant,
      }}
    >
      <div
        ref={selectRef}
        className="relative"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
      >
        {children}
      </div>
    </SelectContext.Provider>
  )
}

// ============================================================================
// Select Trigger
// ============================================================================

interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  placeholder?: string
  id?: string
}

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, placeholder, id, onKeyDown, ...props }, ref) => {
    const { isOpen, setIsOpen, value, disabled, listboxId } = useSelect()
    const triggerRef = React.useRef<HTMLButtonElement>(null)

    const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
      switch (event.key) {
        case "Enter":
        case " ":
          event.preventDefault()
          setIsOpen(!isOpen)
          break
        case "ArrowDown":
          event.preventDefault()
          if (!isOpen) {
            setIsOpen(true)
          }
          break
        case "ArrowUp":
          event.preventDefault()
          if (!isOpen) {
            setIsOpen(true)
          }
          break
        case "Escape":
          event.preventDefault()
          setIsOpen(false)
          break
      }
      onKeyDown?.(event)
    }

    return (
      <button
        ref={(node) => {
          // Handle both refs
          if (typeof ref === "function") {
            ref(node)
          } else if (ref) {
            ref.current = node
          }
          triggerRef.current = node
        }}
        type="button"
        role="combobox"
        id={id}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={cn(
          "flex h-11 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-base ring-offset-white placeholder:text-gray-400",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "md:h-10 md:text-sm",
          className
        )}
        {...props}
      >
        <span className={!children ? "text-gray-400" : ""}>
          {children || placeholder}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 opacity-50 transition-transform shrink-0 ml-2",
            isOpen && "rotate-180"
          )}
          aria-hidden="true"
        />
      </button>
    )
  }
)
SelectTrigger.displayName = "SelectTrigger"

// ============================================================================
// Select Value
// ============================================================================

interface SelectValueProps {
  placeholder?: string
}

const SelectValue: React.FC<SelectValueProps> = ({ placeholder }) => {
  return <>{placeholder}</>
}

// ============================================================================
// Select Content (Listbox)
// ============================================================================

interface SelectContentProps {
  children: React.ReactNode
  className?: string
}

const SelectContent = React.forwardRef<HTMLDivElement, SelectContentProps>(
  ({ className, children }, ref) => {
    const { isOpen, listboxId } = useSelect()

    if (!isOpen) return null

    return (
      <div
        ref={ref}
        id={listboxId}
        role="listbox"
        className={cn(
          "absolute z-50 w-full rounded-md border border-gray-200 bg-white shadow-lg mt-1 max-h-60 overflow-auto",
          className
        )}
      >
        <div className="p-1">{children}</div>
      </div>
    )
  }
)
SelectContent.displayName = "SelectContent"

// ============================================================================
// Select Item (Option)
// ============================================================================

interface SelectItemProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onSelect"> {
  value: string
  children: React.ReactNode
  disabled?: boolean
}

const SelectItem = React.forwardRef<HTMLButtonElement, SelectItemProps>(
  ({ className, children, value, disabled, onClick, onKeyDown, ...props }, ref) => {
    const { value: selectedValue, onChange, setIsOpen, setActiveDescendant } = useSelect()
    const isSelected = selectedValue === value
    const itemId = React.useId()

    const handleClick = () => {
      if (!disabled) {
        onChange?.(value)
        setIsOpen(false)
        // Return focus to trigger
        const trigger = document.activeElement?.closest("[role='combobox']") as HTMLElement
        trigger?.focus()
      }
    }

    const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
      switch (event.key) {
        case "Enter":
        case " ":
          event.preventDefault()
          if (!disabled) {
            onChange?.(value)
            setIsOpen(false)
          }
          break
      }
      onKeyDown?.(event)
    }

    const handleMouseEnter = () => {
      setActiveDescendant(itemId)
    }

    const handleFocus = () => {
      setActiveDescendant(itemId)
    }

    return (
      <button
        ref={ref}
        id={itemId}
        type="button"
        role="option"
        aria-selected={isSelected}
        disabled={disabled}
        className={cn(
          "relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 pl-8 pr-2 text-base outline-none transition-colors",
          "hover:bg-gray-100 focus:bg-gray-100 focus:outline-none",
          "min-h-[44px] md:text-sm md:py-1.5",
          isSelected && "bg-gray-100",
          disabled && "cursor-not-allowed opacity-50",
          className
        )}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onMouseEnter={handleMouseEnter}
        onFocus={handleFocus}
        tabIndex={-1}
        {...props}
      >
        <span
          className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center"
          aria-hidden="true"
        >
          {isSelected && <Check className="h-4 w-4" />}
        </span>
        {children}
      </button>
    )
  }
)
SelectItem.displayName = "SelectItem"

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }
