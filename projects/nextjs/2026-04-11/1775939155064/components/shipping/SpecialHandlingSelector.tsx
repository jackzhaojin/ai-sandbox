"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { 
  Package, 
  AlertTriangle, 
  Thermometer, 
  ShieldAlert, 
  HandHelping,
  ArrowUp,
  Truck,
  Info
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"

export type SpecialHandlingOption = 
  | "fragile"
  | "this-side-up"
  | "temperature-controlled"
  | "hazmat"
  | "white-glove"
  | "inside-delivery"
  | "liftgate-pickup"
  | "liftgate-delivery"

export interface SpecialHandlingOptionConfig {
  id: SpecialHandlingOption
  name: string
  description: string
  fee: number
  icon: React.ReactNode
}

export const specialHandlingOptions: SpecialHandlingOptionConfig[] = [
  {
    id: "fragile",
    name: "Fragile",
    description: "Extra care handling for delicate items",
    fee: 4.99,
    icon: <Package className="h-4 w-4" />,
  },
  {
    id: "this-side-up",
    name: "This Side Up",
    description: "Package must remain in upright orientation",
    fee: 2.99,
    icon: <ArrowUp className="h-4 w-4" />,
  },
  {
    id: "temperature-controlled",
    name: "Temperature Controlled",
    description: "Maintain temperature between 2-8°C",
    fee: 12.99,
    icon: <Thermometer className="h-4 w-4" />,
  },
  {
    id: "hazmat",
    name: "Hazmat",
    description: "Hazardous materials requiring special handling",
    fee: 25.99,
    icon: <ShieldAlert className="h-4 w-4" />,
  },
  {
    id: "white-glove",
    name: "White Glove",
    description: "Premium handling with padded transport",
    fee: 49.99,
    icon: <HandHelping className="h-4 w-4" />,
  },
  {
    id: "inside-delivery",
    name: "Inside Delivery",
    description: "Delivery inside building to specified room",
    fee: 19.99,
    icon: <Package className="h-4 w-4" />,
  },
  {
    id: "liftgate-pickup",
    name: "Liftgate Pickup",
    description: "Hydraulic liftgate for pickup location",
    fee: 15.99,
    icon: <Truck className="h-4 w-4" />,
  },
  {
    id: "liftgate-delivery",
    name: "Liftgate Delivery",
    description: "Hydraulic liftgate for delivery location",
    fee: 15.99,
    icon: <Truck className="h-4 w-4" />,
  },
]

export interface SpecialHandlingData {
  selectedOptions: SpecialHandlingOption[]
  totalFee: number
}

interface SpecialHandlingSelectorProps {
  value?: SpecialHandlingOption[]
  onChange: (data: SpecialHandlingData) => void
  disabled?: boolean
}

export function SpecialHandlingSelector({
  value,
  onChange,
  disabled,
}: SpecialHandlingSelectorProps) {
  const [selectedOptions, setSelectedOptions] = useState<SpecialHandlingOption[]>(value || [])
  
  // Use refs to prevent infinite loops
  const isInitialRender = useRef(true)
  const prevSelectedRef = useRef<string>(JSON.stringify(selectedOptions))

  // Sync with external values
  useEffect(() => {
    if (value && JSON.stringify(value) !== JSON.stringify(selectedOptions)) {
      setSelectedOptions(value)
    }
  }, [value])

  // Calculate total fee
  const calculateTotalFee = useCallback((options: SpecialHandlingOption[]): number => {
    return options.reduce((total, optionId) => {
      const option = specialHandlingOptions.find((o) => o.id === optionId)
      return total + (option?.fee || 0)
    }, 0)
  }, [])

  // Call onChange when selection changes
  useEffect(() => {
    const currentSelectedJson = JSON.stringify(selectedOptions)
    
    // Skip initial render
    if (isInitialRender.current) {
      isInitialRender.current = false
      prevSelectedRef.current = currentSelectedJson
      return
    }

    // Only call onChange if actually changed
    if (prevSelectedRef.current !== currentSelectedJson) {
      prevSelectedRef.current = currentSelectedJson
      onChange({
        selectedOptions,
        totalFee: calculateTotalFee(selectedOptions),
      })
    }
  }, [selectedOptions, onChange, calculateTotalFee])

  const handleToggleOption = useCallback((optionId: SpecialHandlingOption, checked: boolean) => {
    setSelectedOptions((prev) => {
      if (checked) {
        return [...prev, optionId]
      } else {
        return prev.filter((id) => id !== optionId)
      }
    })
  }, [])

  const totalFee = calculateTotalFee(selectedOptions)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {specialHandlingOptions.map((option) => {
          const isSelected = selectedOptions.includes(option.id)
          return (
            <div
              key={option.id}
              className={cn(
                "relative flex items-start p-3 rounded-lg border transition-all duration-200",
                isSelected
                  ? "border-blue-500 bg-blue-50/50"
                  : "border-gray-200 hover:border-gray-300 bg-white",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="flex items-start gap-3 flex-1">
                <Checkbox
                  checked={isSelected}
                  onChange={(checked) => handleToggleOption(option.id, checked)}
                  disabled={disabled}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-gray-600",
                      isSelected && "text-blue-600"
                    )}>
                      {option.icon}
                    </span>
                    <span className="font-medium text-sm text-gray-900">
                      {option.name}
                    </span>
                    <span className={cn(
                      "ml-auto text-xs font-semibold px-2 py-0.5 rounded-full",
                      isSelected
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-600"
                    )}>
                      +${option.fee.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {option.description}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {selectedOptions.length > 0 && (
        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Info className="h-4 w-4" />
            <span>{selectedOptions.length} option(s) selected</span>
          </div>
          <div className="text-right">
            <span className="text-sm text-gray-600">Special Handling Subtotal: </span>
            <span className="font-semibold text-gray-900">${totalFee.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export type { SpecialHandlingSelectorProps }
