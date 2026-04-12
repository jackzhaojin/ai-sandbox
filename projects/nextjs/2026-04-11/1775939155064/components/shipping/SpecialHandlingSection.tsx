"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Shield, Truck, Package, ClipboardList } from "lucide-react"
import { cn } from "@/lib/utils"
import { 
  SpecialHandlingSelector, 
  type SpecialHandlingData,
  type SpecialHandlingOption 
} from "./SpecialHandlingSelector"
import { 
  HazmatForm, 
  type HazmatData 
} from "./HazmatForm"
import { 
  DeliveryPreferencesSelector, 
  type DeliveryPreferencesData,
  type DeliveryPreferenceOption 
} from "./DeliveryPreferencesSelector"
import { 
  MultiPieceForm, 
  type MultiPieceData,
  type Piece 
} from "./MultiPieceForm"
import { 
  PackageSummary,
  type PackageSummaryData 
} from "./PackageSummary"
import type { PackageConfigurationData } from "./PackageConfigurationSection"

export interface SpecialHandlingSectionData {
  specialHandling: SpecialHandlingData
  deliveryPreferences: DeliveryPreferencesData
  hazmatDetails?: HazmatData
  multiPiece?: MultiPieceData
}

interface SpecialHandlingSectionProps {
  value?: Partial<SpecialHandlingSectionData>
  onChange: (data: SpecialHandlingSectionData) => void
  packageConfig?: PackageConfigurationData
  disabled?: boolean
  errors?: {
    specialHandling?: string
    deliveryPreferences?: string
    hazmat?: {
      unNumber?: string
      properShippingName?: string
      hazardClass?: string
      packingGroup?: string
      quantity?: string
      emergencyContactName?: string
      emergencyContactPhone?: string
    }
    multiPiece?: string
  }
}

const defaultData: SpecialHandlingSectionData = {
  specialHandling: {
    selectedOptions: [],
    totalFee: 0,
  },
  deliveryPreferences: {
    selectedOptions: [],
    totalFee: 0,
  },
}

export function SpecialHandlingSection({
  value,
  onChange,
  packageConfig,
  disabled,
  errors,
}: SpecialHandlingSectionProps) {
  const [data, setData] = useState<SpecialHandlingSectionData>({
    ...defaultData,
    ...value,
    specialHandling: {
      ...defaultData.specialHandling,
      ...value?.specialHandling,
    },
    deliveryPreferences: {
      ...defaultData.deliveryPreferences,
      ...value?.deliveryPreferences,
    },
  })

  // Use refs to prevent infinite loops
  const isInitialRender = useRef(true)
  const prevDataRef = useRef<string>("")

  // Check if hazmat is selected
  const isHazmatSelected = data.specialHandling.selectedOptions.includes("hazmat")
  
  // Check if this is a multi-piece shipment (based on package type)
  const isMultiPiece = packageConfig?.packageTypeId === "custom"

  // Sync with external values
  useEffect(() => {
    if (value) {
      setData((prev) => ({
        ...prev,
        ...value,
        specialHandling: {
          ...prev.specialHandling,
          ...value.specialHandling,
        },
        deliveryPreferences: {
          ...prev.deliveryPreferences,
          ...value.deliveryPreferences,
        },
      }))
    }
  }, [])

  // Call onChange when data changes
  useEffect(() => {
    const currentDataJson = JSON.stringify(data)

    // Skip initial render
    if (isInitialRender.current) {
      isInitialRender.current = false
      prevDataRef.current = currentDataJson
      // Call onChange with initial data
      onChange(data)
      return
    }

    // Only call onChange if data actually changed
    if (prevDataRef.current !== currentDataJson) {
      prevDataRef.current = currentDataJson
      onChange(data)
    }
  }, [data, onChange])

  const updateSpecialHandling = useCallback((specialHandling: SpecialHandlingData) => {
    setData((prev) => ({
      ...prev,
      specialHandling,
      // Clear hazmat details if hazmat is deselected
      hazmatDetails: specialHandling.selectedOptions.includes("hazmat") 
        ? prev.hazmatDetails 
        : undefined,
    }))
  }, [])

  const updateHazmatDetails = useCallback((hazmatDetails: HazmatData) => {
    setData((prev) => ({
      ...prev,
      hazmatDetails,
    }))
  }, [])

  const updateDeliveryPreferences = useCallback((deliveryPreferences: DeliveryPreferencesData) => {
    setData((prev) => ({
      ...prev,
      deliveryPreferences,
    }))
  }, [])

  const updateMultiPiece = useCallback((multiPiece: MultiPieceData) => {
    setData((prev) => ({
      ...prev,
      multiPiece,
    }))
  }, [])

  // Prepare summary data
  const summaryData: PackageSummaryData = {
    packageConfig,
    specialHandling: data.specialHandling,
    deliveryPreferences: data.deliveryPreferences,
    multiPiece: data.multiPiece,
  }

  return (
    <div className="border-b border-gray-200 pb-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">
          3
        </span>
        <Shield className="h-5 w-5 text-blue-600" />
        Special Handling & Delivery
      </h2>

      <div className="space-y-6">
        {/* Special Handling Selector */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Special Handling Options</h3>
            <span className="text-xs text-gray-500">Select all that apply</span>
          </div>
          <SpecialHandlingSelector
            value={data.specialHandling.selectedOptions}
            onChange={updateSpecialHandling}
            disabled={disabled}
          />
          {errors?.specialHandling && (
            <p className="text-xs text-red-600">{errors.specialHandling}</p>
          )}
        </div>

        {/* Hazmat Form (conditional) */}
        {isHazmatSelected && (
          <div className="pt-4 border-t border-gray-100">
            <HazmatForm
              value={data.hazmatDetails}
              onChange={updateHazmatDetails}
              disabled={disabled}
              errors={errors?.hazmat}
            />
          </div>
        )}

        {/* Multi-Piece Form (conditional on custom package type) */}
        {isMultiPiece && (
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Package className="h-4 w-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-900">Multi-Piece Configuration</h3>
            </div>
            <MultiPieceForm
              value={data.multiPiece?.pieces}
              onChange={updateMultiPiece}
              disabled={disabled}
              maxPieces={20}
            />
            {errors?.multiPiece && (
              <p className="text-xs text-red-600 mt-2">{errors.multiPiece}</p>
            )}
          </div>
        )}

        {/* Delivery Preferences */}
        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <Truck className="h-4 w-4 text-gray-600" />
            <h3 className="text-sm font-semibold text-gray-900">Delivery Preferences</h3>
          </div>
          <DeliveryPreferencesSelector
            value={data.deliveryPreferences.selectedOptions}
            onChange={updateDeliveryPreferences}
            disabled={disabled}
          />
          {errors?.deliveryPreferences && (
            <p className="text-xs text-red-600 mt-2">{errors.deliveryPreferences}</p>
          )}
        </div>

        {/* Package Summary */}
        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <ClipboardList className="h-4 w-4 text-gray-600" />
            <h3 className="text-sm font-semibold text-gray-900">Summary</h3>
          </div>
          <PackageSummary data={summaryData} />
        </div>
      </div>
    </div>
  )
}

export type { SpecialHandlingSectionProps }
export { SpecialHandlingSelector } from "./SpecialHandlingSelector"
export type { SpecialHandlingData, SpecialHandlingOption } from "./SpecialHandlingSelector"
export { HazmatForm } from "./HazmatForm"
export type { HazmatData } from "./HazmatForm"
export { DeliveryPreferencesSelector } from "./DeliveryPreferencesSelector"
export type { DeliveryPreferencesData, DeliveryPreferenceOption } from "./DeliveryPreferencesSelector"
export { MultiPieceForm } from "./MultiPieceForm"
export type { MultiPieceData, Piece, PieceType } from "./MultiPieceForm"
export { PackageSummary } from "./PackageSummary"
export type { PackageSummaryData } from "./PackageSummary"
