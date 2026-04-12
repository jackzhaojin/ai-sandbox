"use client"

import { DollarSign, Truck, Package, CreditCard, AlertCircle, CheckCircle2, Percent } from "lucide-react"
import { cn } from "@/lib/utils"
import type { PaymentMethod } from "@/lib/validation"
import { PAYMENT_METHOD_FEES, PAYMENT_METHOD_LABELS } from "@/lib/validation"

interface CostSummaryProps {
  subtotal: number
  currency?: string
  selectedMethod: PaymentMethod | null
  shipmentDetails?: {
    origin?: { city: string; state: string }
    destination?: { city: string; state: string }
    package?: { weight: number; weightUnit: string }
    carrierName?: string
    serviceName?: string
  }
  className?: string
}

export function CostSummary({
  subtotal,
  currency = "USD",
  selectedMethod,
  shipmentDetails,
  className,
}: CostSummaryProps) {
  // Calculate fee based on payment method
  const feePercent = selectedMethod ? PAYMENT_METHOD_FEES[selectedMethod] : 0
  const feeAmount = (subtotal * feePercent) / 100
  const total = subtotal + feeAmount

  // Determine fee styling
  const hasFee = feePercent > 0
  const feeColorClass = hasFee ? "text-orange-600" : "text-green-600"
  const feeBadgeClass = hasFee
    ? "bg-orange-50 text-orange-700 border-orange-200"
    : "bg-green-50 text-green-700 border-green-200"

  return (
    <div className={cn("bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden", className)}>
      {/* Header */}
      <div className="bg-gray-50 px-5 py-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-blue-600" />
          Cost Summary
        </h3>
      </div>

      <div className="p-5 space-y-5">
        {/* Shipment Details */}
        {shipmentDetails && (
          <div className="space-y-3 pb-4 border-b border-gray-100">
            <h4 className="text-sm font-medium text-gray-700">Shipment Details</h4>
            
            {/* Route */}
            {shipmentDetails.origin && shipmentDetails.destination && (
              <div className="flex items-center gap-2 text-sm">
                <Truck className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">
                  {shipmentDetails.origin.city}, {shipmentDetails.origin.state} →{" "}
                  {shipmentDetails.destination.city}, {shipmentDetails.destination.state}
                </span>
              </div>
            )}

            {/* Package */}
            {shipmentDetails.package && (
              <div className="flex items-center gap-2 text-sm">
                <Package className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">
                  {shipmentDetails.package.weight} {shipmentDetails.package.weightUnit}
                </span>
              </div>
            )}

            {/* Carrier */}
            {shipmentDetails.carrierName && (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-gray-600">
                  {shipmentDetails.carrierName} - {shipmentDetails.serviceName}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Cost Breakdown */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Payment Breakdown</h4>

          {/* Subtotal */}
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Shipment Subtotal</span>
            <span className="font-medium text-gray-900">
              ${subtotal.toFixed(2)} {currency}
            </span>
          </div>

          {/* Payment Method Fee */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                {selectedMethod ? PAYMENT_METHOD_LABELS[selectedMethod] : "Payment Method"}
              </span>
            </div>
            <div className={cn("flex items-center gap-2", feeColorClass)}>
              {hasFee ? (
                <>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded border">
                    <Percent className="h-3 w-3" />
                    {feePercent}%
                  </span>
                  <span className="font-medium">+${feeAmount.toFixed(2)}</span>
                </>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded border bg-green-50 text-green-700 border-green-200">
                  <CheckCircle2 className="h-3 w-3" />
                  No fee
                </span>
              )}
            </div>
          </div>

          {/* Fee Explanation */}
          {selectedMethod && (
            <div className={cn("text-xs px-3 py-2 rounded border", feeBadgeClass)}>
              {hasFee ? (
                <div className="flex items-start gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>
                    {PAYMENT_METHOD_LABELS[selectedMethod]} incurs a {feePercent}% processing fee
                  </span>
                </div>
              ) : (
                <div className="flex items-start gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>
                    {PAYMENT_METHOD_LABELS[selectedMethod]} has no additional fees
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-gray-200 pt-3 mt-3">
            {/* Total */}
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-900">Total Amount</span>
              <span className="font-bold text-xl text-gray-900">
                ${total.toFixed(2)} {currency}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Method Comparison */}
        {selectedMethod && (
          <div className="pt-4 border-t border-gray-100">
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
              Fee Comparison
            </h4>
            <div className="space-y-2">
              {Object.entries(PAYMENT_METHOD_FEES).map(([method, fee]) => {
                const isSelected = selectedMethod === method
                return (
                  <div
                    key={method}
                    className={cn(
                      "flex justify-between items-center text-sm px-2 py-1.5 rounded",
                      isSelected ? "bg-blue-50" : "text-gray-500"
                    )}
                  >
                    <span className={cn(isSelected && "font-medium text-gray-900")}>
                      {PAYMENT_METHOD_LABELS[method as PaymentMethod]}
                    </span>
                    <span
                      className={cn(
                        "font-medium",
                        fee > 0 ? "text-orange-600" : "text-green-600",
                        isSelected && "font-bold"
                      )}
                    >
                      {fee > 0 ? `${fee}%` : "Free"}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Helper function to calculate total with fee
export function calculateTotalWithFee(
  subtotal: number,
  paymentMethod: PaymentMethod | null
): { subtotal: number; feeAmount: number; feePercent: number; total: number } {
  const feePercent = paymentMethod ? PAYMENT_METHOD_FEES[paymentMethod] : 0
  const feeAmount = (subtotal * feePercent) / 100
  const total = subtotal + feeAmount

  return { subtotal, feeAmount, feePercent, total }
}
