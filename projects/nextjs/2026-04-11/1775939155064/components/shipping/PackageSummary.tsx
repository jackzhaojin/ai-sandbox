"use client"

import { Package, Truck, AlertCircle, DollarSign, Scale } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SpecialHandlingOption } from "./SpecialHandlingSelector"
import { specialHandlingOptions } from "./SpecialHandlingSelector"
import type { DeliveryPreferenceOption } from "./DeliveryPreferencesSelector"
import { deliveryPreferenceOptions } from "./DeliveryPreferencesSelector"
import type { MultiPieceData } from "./MultiPieceForm"
import type { PackageConfigurationData } from "./PackageConfigurationSection"

export interface PackageSummaryData {
  packageConfig?: PackageConfigurationData
  specialHandling: {
    selectedOptions: SpecialHandlingOption[]
    totalFee: number
  }
  deliveryPreferences: {
    selectedOptions: DeliveryPreferenceOption[]
    totalFee: number
  }
  multiPiece?: MultiPieceData
}

interface PackageSummaryProps {
  data: PackageSummaryData
  className?: string
}

export function PackageSummary({ data, className }: PackageSummaryProps) {
  const { packageConfig, specialHandling, deliveryPreferences, multiPiece } = data

  // Calculate subtotal
  const specialHandlingFee = specialHandling?.totalFee || 0
  const deliveryFee = deliveryPreferences?.totalFee || 0
  const estimatedSubtotal = specialHandlingFee + deliveryFee

  // Get selected option details
  const selectedSpecialHandling = specialHandling?.selectedOptions
    .map((id) => specialHandlingOptions.find((o) => o.id === id))
    .filter(Boolean) || []

  const selectedDeliveryPrefs = deliveryPreferences?.selectedOptions
    .map((id) => deliveryPreferenceOptions.find((o) => o.id === id))
    .filter(Boolean) || []

  const hasAnyData = 
    packageConfig || 
    selectedSpecialHandling.length > 0 || 
    selectedDeliveryPrefs.length > 0 ||
    multiPiece

  if (!hasAnyData) {
    return (
      <div className={cn("bg-gray-50 border border-gray-200 rounded-lg p-4", className)}>
        <div className="flex items-center gap-2 text-gray-500">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">No configuration yet</span>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("bg-white border border-gray-200 rounded-lg overflow-hidden", className)}>
      {/* Header */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-blue-600" />
          <h4 className="font-semibold text-sm text-gray-900">Package Summary</h4>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Package Configuration */}
        {packageConfig && packageConfig.packageTypeId && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Package className="h-4 w-4 text-gray-500" />
              <span className="font-medium text-gray-900">Package Details</span>
            </div>
            <div className="bg-gray-50 rounded p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span className="font-medium text-gray-900 capitalize">
                  {packageConfig.packageTypeId.replace(/-/g, " ")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Dimensions:</span>
                <span className="font-medium text-gray-900">
                  {packageConfig.length} × {packageConfig.width} × {packageConfig.height} {packageConfig.dimensionUnit}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Weight:</span>
                <span className="font-medium text-gray-900">
                  {packageConfig.weight} {packageConfig.weightUnit}
                </span>
              </div>
              {packageConfig.declaredValue > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Declared Value:</span>
                  <span className="font-medium text-gray-900">
                    {packageConfig.currency === "USD" ? "$" : packageConfig.currency === "CAD" ? "C$" : "MX$"}
                    {packageConfig.declaredValue.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Multi-Piece Summary */}
        {multiPiece && multiPiece.totalPieces > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Package className="h-4 w-4 text-gray-500" />
              <span className="font-medium text-gray-900">Multi-Piece Shipment</span>
            </div>
            <div className="bg-gray-50 rounded p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Pieces:</span>
                <span className="font-medium text-gray-900">{multiPiece.totalPieces}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Weight:</span>
                <span className="font-medium text-gray-900">{multiPiece.totalWeight.toFixed(2)} lbs</span>
              </div>
            </div>
          </div>
        )}

        {/* Special Handling */}
        {selectedSpecialHandling.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <span className="font-medium text-gray-900">Special Handling</span>
            </div>
            <div className="bg-gray-50 rounded p-3 space-y-1">
              {selectedSpecialHandling.map((option) => (
                <div key={option!.id} className="flex justify-between text-sm">
                  <span className="text-gray-600">{option!.name}</span>
                  <span className="font-medium text-gray-900">+${option!.fee.toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 border-t border-gray-200 mt-2">
                <span className="text-sm font-medium text-gray-700">Special Handling Subtotal</span>
                <span className="font-semibold text-gray-900">${specialHandlingFee.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Delivery Preferences */}
        {selectedDeliveryPrefs.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Truck className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-gray-900">Delivery Preferences</span>
            </div>
            <div className="bg-gray-50 rounded p-3 space-y-1">
              {selectedDeliveryPrefs.map((option) => (
                <div key={option!.id} className="flex justify-between text-sm">
                  <span className="text-gray-600">{option!.name}</span>
                  <span className={cn(
                    "font-medium",
                    option!.fee === 0 ? "text-green-600" : "text-gray-900"
                  )}>
                    {option!.fee === 0 ? "FREE" : `+$${option!.fee.toFixed(2)}`}
                  </span>
                </div>
              ))}
              <div className="flex justify-between pt-2 border-t border-gray-200 mt-2">
                <span className="text-sm font-medium text-gray-700">Delivery Subtotal</span>
                <span className="font-semibold text-gray-900">${deliveryFee.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Estimated Subtotal */}
        <div className="pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="font-semibold text-gray-900">Estimated Subtotal</span>
            </div>
            <span className="text-xl font-bold text-green-600">
              ${estimatedSubtotal.toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            *Shipping costs will be calculated on the next step
          </p>
        </div>
      </div>
    </div>
  )
}

export type { PackageSummaryProps }
