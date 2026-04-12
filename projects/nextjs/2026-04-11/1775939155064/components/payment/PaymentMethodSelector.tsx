"use client"

import { Check, FileText, Truck, Building2, CreditCard, Landmark, Star, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  type PaymentMethod,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHOD_FEES,
} from "@/lib/validation"

interface PaymentMethodOption {
  id: PaymentMethod
  icon: React.ReactNode
  badge?: string
  feePercent: number
  description: string
}

const PAYMENT_METHOD_OPTIONS: PaymentMethodOption[] = [
  {
    id: "purchase_order",
    icon: <FileText className="h-6 w-6" />,
    badge: "Most Popular",
    feePercent: 0,
    description: "Pay using your company's purchase order system",
  },
  {
    id: "bill_of_lading",
    icon: <Truck className="h-6 w-6" />,
    feePercent: 0,
    description: "Charge to freight bill of lading",
  },
  {
    id: "third_party",
    icon: <Building2 className="h-6 w-6" />,
    feePercent: 2.5,
    description: "Bill to a third-party account",
  },
  {
    id: "net_terms",
    icon: <CreditCard className="h-6 w-6" />,
    feePercent: 1.5,
    description: "Apply for credit terms (15-60 days)",
  },
  {
    id: "corporate_account",
    icon: <Landmark className="h-6 w-6" />,
    feePercent: 0,
    description: "Use pre-negotiated corporate rates",
  },
]

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod | null
  onSelect: (method: PaymentMethod) => void
  disabled?: boolean
  className?: string
  shipmentTotal?: number
}

export function PaymentMethodSelector({
  selectedMethod,
  onSelect,
  disabled = false,
  className,
  shipmentTotal = 0,
}: PaymentMethodSelectorProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {PAYMENT_METHOD_OPTIONS.map((option) => {
          const isSelected = selectedMethod === option.id
          const feeAmount = shipmentTotal > 0 ? (shipmentTotal * option.feePercent) / 100 : 0

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => !disabled && onSelect(option.id)}
              disabled={disabled}
              className={cn(
                "relative flex flex-col items-start p-5 rounded-xl border-2 transition-all duration-200 text-left",
                "hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                isSelected
                  ? "border-blue-600 bg-blue-50/50 shadow-md"
                  : "border-gray-200 bg-white hover:border-gray-300",
                disabled && "opacity-50 cursor-not-allowed hover:shadow-none"
              )}
              aria-pressed={isSelected}
            >
              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3">
                  <div className="bg-blue-600 text-white rounded-full p-1">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                </div>
              )}

              {/* Badge */}
              {option.badge && (
                <div className="absolute top-3 right-3">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                    <Star className="h-3 w-3 fill-yellow-600" />
                    {option.badge}
                  </span>
                </div>
              )}

              {/* Icon */}
              <div
                className={cn(
                  "p-2.5 rounded-lg mb-3",
                  isSelected ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
                )}
              >
                {option.icon}
              </div>

              {/* Title */}
              <h3 className="font-semibold text-gray-900 mb-1">
                {PAYMENT_METHOD_LABELS[option.id]}
              </h3>

              {/* Description */}
              <p className="text-sm text-gray-500 mb-3">{option.description}</p>

              {/* Fee indicator */}
              <div className="mt-auto flex items-center gap-2">
                {option.feePercent > 0 ? (
                  <>
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-orange-50 text-orange-700 rounded">
                      <AlertTriangle className="h-3 w-3" />
                      {option.feePercent}% fee
                    </span>
                    {shipmentTotal > 0 && (
                      <span className="text-xs text-gray-500">
                        (${feeAmount.toFixed(2)})
                      </span>
                    )}
                  </>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-50 text-green-700 rounded">
                    No fee
                  </span>
                )}
              </div>

              {/* Radio button */}
              <div className="absolute top-3 left-3">
                <div
                  className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                    isSelected
                      ? "border-blue-600 bg-blue-600"
                      : "border-gray-300 bg-white"
                  )}
                >
                  {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export { PAYMENT_METHOD_OPTIONS }
