"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { 
  PenTool, 
  UserCheck, 
  MessageSquare, 
  Camera, 
  Calendar,
  MapPin,
  Info
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"

export type DeliveryPreferenceOption = 
  | "signature"
  | "adult-signature"
  | "sms-confirmation"
  | "photo-proof"
  | "saturday-delivery"
  | "hold-at-location"

export interface DeliveryPreferenceConfig {
  id: DeliveryPreferenceOption
  name: string
  description: string
  fee: number
  icon: React.ReactNode
}

export const deliveryPreferenceOptions: DeliveryPreferenceConfig[] = [
  {
    id: "signature",
    name: "Signature Required",
    description: "Recipient signature required upon delivery",
    fee: 3.99,
    icon: <PenTool className="h-4 w-4" />,
  },
  {
    id: "adult-signature",
    name: "Adult Signature (21+)",
    description: "Adult signature (21+) required upon delivery",
    fee: 6.99,
    icon: <UserCheck className="h-4 w-4" />,
  },
  {
    id: "sms-confirmation",
    name: "SMS Confirmation",
    description: "Receive SMS updates on delivery status",
    fee: 0.99,
    icon: <MessageSquare className="h-4 w-4" />,
  },
  {
    id: "photo-proof",
    name: "Photo Proof of Delivery",
    description: "Photo confirmation when package is delivered",
    fee: 1.99,
    icon: <Camera className="h-4 w-4" />,
  },
  {
    id: "saturday-delivery",
    name: "Saturday Delivery",
    description: "Delivery on Saturday (normally excluded)",
    fee: 16.99,
    icon: <Calendar className="h-4 w-4" />,
  },
  {
    id: "hold-at-location",
    name: "Hold at Location",
    description: "Hold at facility for customer pickup",
    fee: 0,
    icon: <MapPin className="h-4 w-4" />,
  },
]

export interface DeliveryPreferencesData {
  selectedOptions: DeliveryPreferenceOption[]
  totalFee: number
}

interface DeliveryPreferencesSelectorProps {
  value?: DeliveryPreferenceOption[]
  onChange: (data: DeliveryPreferencesData) => void
  disabled?: boolean
}

export function DeliveryPreferencesSelector({
  value,
  onChange,
  disabled,
}: DeliveryPreferencesSelectorProps) {
  const [selectedOptions, setSelectedOptions] = useState<DeliveryPreferenceOption[]>(value || [])
  
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
  const calculateTotalFee = useCallback((options: DeliveryPreferenceOption[]): number => {
    return options.reduce((total, optionId) => {
      const option = deliveryPreferenceOptions.find((o) => o.id === optionId)
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

  const handleToggleOption = useCallback((optionId: DeliveryPreferenceOption, checked: boolean) => {
    setSelectedOptions((prev) => {
      // Handle mutually exclusive signature options
      if (optionId === "signature" && checked && prev.includes("adult-signature")) {
        // If selecting signature, remove adult-signature
        return [...prev.filter((id) => id !== "adult-signature"), optionId]
      }
      if (optionId === "adult-signature" && checked && prev.includes("signature")) {
        // If selecting adult-signature, remove signature
        return [...prev.filter((id) => id !== "signature"), optionId]
      }

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
        {deliveryPreferenceOptions.map((option) => {
          const isSelected = selectedOptions.includes(option.id)
          const isSignatureConflict = 
            (option.id === "signature" && selectedOptions.includes("adult-signature")) ||
            (option.id === "adult-signature" && selectedOptions.includes("signature"))
          
          return (
            <div
              key={option.id}
              className={cn(
                "relative flex items-start p-3 rounded-lg border transition-all duration-200",
                isSelected
                  ? "border-blue-500 bg-blue-50/50"
                  : "border-gray-200 hover:border-gray-300 bg-white",
                disabled && "opacity-50 cursor-not-allowed",
                isSignatureConflict && option.id !== selectedOptions.find(id => id === "signature" || id === "adult-signature") && "opacity-60"
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
                      option.fee === 0
                        ? "bg-green-100 text-green-700"
                        : isSelected
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-600"
                    )}>
                      {option.fee === 0 ? "FREE" : `+$${option.fee.toFixed(2)}`}
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

      {/* Hold at location details */}
      {selectedOptions.includes("hold-at-location") && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <h5 className="font-medium text-sm text-gray-900">Hold at Location Details</h5>
          <p className="text-sm text-gray-600">
            Your package will be held at the nearest facility for pickup. 
            You will receive a notification when it is ready.
          </p>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Info className="h-4 w-4 text-blue-500" />
            <span>Pickup typically available 24-48 hours after arrival</span>
          </div>
        </div>
      )}

      {selectedOptions.length > 0 && (
        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Info className="h-4 w-4" />
            <span>{selectedOptions.length} option(s) selected</span>
          </div>
          <div className="text-right">
            <span className="text-sm text-gray-600">Delivery Preferences Subtotal: </span>
            <span className="font-semibold text-gray-900">${totalFee.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export type { DeliveryPreferencesSelectorProps }
