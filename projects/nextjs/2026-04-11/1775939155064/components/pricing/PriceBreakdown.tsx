"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, Info } from "lucide-react"
import { cn } from "@/lib/utils"

interface PriceBreakdownItem {
  label: string
  amount: number
  percent?: number
  isNegative?: boolean
}

interface CalculationBasis {
  distance: number
  zone: number
  billableWeight: number
  actualWeight: number
  dimWeight: number
}

interface PriceBreakdownProps {
  baseRate: number
  fuelSurcharge: number
  fuelSurchargePercent: number
  insurance: number
  insuranceRate: number
  specialHandlingTotal: number
  deliveryConfirmationTotal: number
  tax: number
  taxRate: number
  total: number
  currency?: string
  calculationBasis: CalculationBasis
  specialHandlingDetails?: { name: string; fee: number }[]
  deliveryConfirmationDetails?: { name: string; fee: number }[]
  className?: string
}

export function PriceBreakdown({
  baseRate,
  fuelSurcharge,
  fuelSurchargePercent,
  insurance,
  insuranceRate,
  specialHandlingTotal,
  deliveryConfirmationTotal,
  tax,
  taxRate,
  total,
  currency = "USD",
  calculationBasis,
  specialHandlingDetails = [],
  deliveryConfirmationDetails = [],
  className,
}: PriceBreakdownProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const currencySymbol = currency === "USD" ? "$" : currency === "CAD" ? "C$" : "MX$"

  const formatCurrency = (amount: number) => `${currencySymbol}${amount.toFixed(2)}`
  const formatPercent = (decimal: number) => `${(decimal * 100).toFixed(1)}%`

  const lineItems: PriceBreakdownItem[] = [
    { label: "Base Rate", amount: baseRate },
    { label: `Fuel Surcharge (${formatPercent(fuelSurchargePercent)})`, amount: fuelSurcharge },
    { label: `Insurance (${formatPercent(insuranceRate)})`, amount: insurance },
    ...(specialHandlingTotal > 0 ? [{ label: "Special Handling", amount: specialHandlingTotal }] : []),
    ...(deliveryConfirmationTotal > 0 ? [{ label: "Delivery Preferences", amount: deliveryConfirmationTotal }] : []),
    { label: `Tax (${formatPercent(taxRate)})`, amount: tax },
  ]

  const subtotal = baseRate + fuelSurcharge + insurance + specialHandlingTotal + deliveryConfirmationTotal

  return (
    <div className={cn("border-t border-gray-100", className)}>
      {/* Toggle button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-center gap-2 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <span>{isExpanded ? "Hide price breakdown" : "View price breakdown"}</span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>

      {/* Expanded breakdown */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Line items */}
          <div className="space-y-2">
            {lineItems.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-gray-600">{item.label}</span>
                <span className="font-medium text-gray-900">{formatCurrency(item.amount)}</span>
              </div>
            ))}
          </div>

          {/* Special handling details */}
          {specialHandlingDetails.length > 0 && (
            <div className="pl-4 space-y-1 border-l-2 border-gray-200">
              <p className="text-xs font-medium text-gray-500 mb-2">Special Handling Details</p>
              {specialHandlingDetails.map((detail, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-500">{detail.name}</span>
                  <span className="text-gray-700">{formatCurrency(detail.fee)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Delivery confirmation details */}
          {deliveryConfirmationDetails.length > 0 && (
            <div className="pl-4 space-y-1 border-l-2 border-gray-200">
              <p className="text-xs font-medium text-gray-500 mb-2">Delivery Preference Details</p>
              {deliveryConfirmationDetails.map((detail, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-500">{detail.name}</span>
                  <span className="text-gray-700">
                    {detail.fee === 0 ? "FREE" : formatCurrency(detail.fee)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Subtotal */}
          <div className="flex justify-between pt-2 border-t border-gray-200">
            <span className="text-sm font-medium text-gray-700">Subtotal</span>
            <span className="font-semibold text-gray-900">{formatCurrency(subtotal)}</span>
          </div>

          {/* Total */}
          <div className="flex justify-between pt-2 border-t-2 border-gray-300">
            <span className="text-base font-semibold text-gray-900">Total</span>
            <span className="text-lg font-bold text-gray-900">{formatCurrency(total)}</span>
          </div>

          {/* Calculation basis */}
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2 text-gray-600">
              <Info className="h-4 w-4" />
              <span className="text-xs font-medium">Calculation Basis</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Distance:</span>
                <span className="text-gray-700">{calculationBasis.distance} mi</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Zone:</span>
                <span className="text-gray-700">{calculationBasis.zone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Billable Weight:</span>
                <span className="text-gray-700">{calculationBasis.billableWeight.toFixed(1)} lbs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Actual Weight:</span>
                <span className="text-gray-700">{calculationBasis.actualWeight.toFixed(1)} lbs</span>
              </div>
              <div className="flex justify-between col-span-2">
                <span className="text-gray-500">DIM Weight:</span>
                <span className="text-gray-700">{calculationBasis.dimWeight.toFixed(1)} lbs</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
