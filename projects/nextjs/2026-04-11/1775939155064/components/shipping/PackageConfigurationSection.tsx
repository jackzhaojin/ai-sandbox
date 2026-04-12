"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Box, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { PresetSelector, type PresetConfig } from "./PresetSelector"
import { PackageTypeSelector, packageTypes, type PackageType } from "./PackageTypeSelector"
import { DimensionsInput, type DimensionUnit } from "./DimensionsInput"
import { WeightInput, type WeightUnit } from "./WeightInput"
import { DeclaredValueInput, type CurrencyCode } from "./DeclaredValueInput"

export interface PackageConfigurationData {
  presetId?: string
  packageTypeId: string
  length: number
  width: number
  height: number
  dimensionUnit: DimensionUnit
  weight: number
  weightUnit: WeightUnit
  declaredValue: number
  currency: CurrencyCode
  contentsDescription?: string
}

interface PackageConfigurationSectionProps {
  value?: Partial<PackageConfigurationData>
  onChange: (data: PackageConfigurationData) => void
  disabled?: boolean
  errors?: {
    packageTypeId?: string
    length?: string
    width?: string
    height?: string
    weight?: string
    declaredValue?: string
    contentsDescription?: string
  }
}

// Calculate DIM weight: L×W×H / 166 (for inches)
function calculateDIMWeight(length: number, width: number, height: number, unit: DimensionUnit): number {
  if (!length || !width || !height) return 0
  
  let volumeInCubicInches: number
  if (unit === "in") {
    volumeInCubicInches = length * width * height
  } else {
    // Convert from cm to inches first (1 inch = 2.54 cm)
    volumeInCubicInches = (length / 2.54) * (width / 2.54) * (height / 2.54)
  }
  
  // DIM weight divisor is 166 for domestic shipments
  const dimWeight = volumeInCubicInches / 166
  return Math.round(dimWeight * 10) / 10
}

// Convert kg to lbs
function kgToLbs(kg: number): number {
  return Math.round(kg * 2.20462 * 10) / 10
}

// Convert cm to inches
function cmToInches(cm: number): number {
  return Math.round((cm / 2.54) * 10) / 10
}

export function PackageConfigurationSection({
  value,
  onChange,
  disabled,
  errors,
}: PackageConfigurationSectionProps) {
  // Initialize with defaults or provided values
  const [data, setData] = useState<PackageConfigurationData>({
    presetId: value?.presetId,
    packageTypeId: value?.packageTypeId || "",
    length: value?.length || 0,
    width: value?.width || 0,
    height: value?.height || 0,
    dimensionUnit: value?.dimensionUnit || "in",
    weight: value?.weight || 0,
    weightUnit: value?.weightUnit || "lbs",
    declaredValue: value?.declaredValue || 0,
    currency: value?.currency || "USD",
    contentsDescription: value?.contentsDescription || "",
  })

  // Use a ref to track if this is the initial render
  const isInitialRender = useRef(true)
  const prevDataRef = useRef(data)

  // Sync with external values
  useEffect(() => {
    if (value) {
      setData((prev) => ({
        ...prev,
        ...value,
      }))
    }
  }, [value?.presetId, value?.packageTypeId, value?.currency])

  // Call onChange after state updates (not during render)
  useEffect(() => {
    // Skip the initial render
    if (isInitialRender.current) {
      isInitialRender.current = false
      prevDataRef.current = data
      return
    }

    // Only call onChange if data has actually changed
    const prevData = prevDataRef.current
    if (
      prevData.presetId !== data.presetId ||
      prevData.packageTypeId !== data.packageTypeId ||
      prevData.length !== data.length ||
      prevData.width !== data.width ||
      prevData.height !== data.height ||
      prevData.dimensionUnit !== data.dimensionUnit ||
      prevData.weight !== data.weight ||
      prevData.weightUnit !== data.weightUnit ||
      prevData.declaredValue !== data.declaredValue ||
      prevData.currency !== data.currency ||
      prevData.contentsDescription !== data.contentsDescription
    ) {
      prevDataRef.current = data
      onChange(data)
    }
  }, [data, onChange])

  const updateData = useCallback((updates: Partial<PackageConfigurationData>) => {
    setData((prev) => ({ ...prev, ...updates }))
  }, [])

  // Get current package type limits
  const currentPackageType = packageTypes.find((pt) => pt.id === data.packageTypeId)
  
  // Convert max dimensions to current unit
  const maxDimensions = currentPackageType
    ? {
        length: data.dimensionUnit === "in" 
          ? cmToInches(currentPackageType.maxLength) 
          : currentPackageType.maxLength,
        width: data.dimensionUnit === "in" 
          ? cmToInches(currentPackageType.maxWidth) 
          : currentPackageType.maxWidth,
        height: data.dimensionUnit === "in" 
          ? cmToInches(currentPackageType.maxHeight) 
          : currentPackageType.maxHeight,
      }
    : undefined

  // Handle preset selection
  const handlePresetSelect = (preset: PresetConfig) => {
    // Convert preset values (which are in imperial) to current units if needed
    const newLength = data.dimensionUnit === "cm" ? Math.round(preset.length * 2.54 * 10) / 10 : preset.length
    const newWidth = data.dimensionUnit === "cm" ? Math.round(preset.width * 2.54 * 10) / 10 : preset.width
    const newHeight = data.dimensionUnit === "cm" ? Math.round(preset.height * 2.54 * 10) / 10 : preset.height
    const newWeight = data.weightUnit === "kg" ? Math.round((preset.weight / 2.20462) * 10) / 10 : preset.weight

    updateData({
      presetId: preset.id,
      packageTypeId: preset.packageType,
      length: newLength,
      width: newWidth,
      height: newHeight,
      weight: newWeight,
      declaredValue: preset.declaredValue,
    })
  }

  // Handle package type selection
  const handlePackageTypeChange = (packageType: PackageType) => {
    updateData({ packageTypeId: packageType.id })
  }

  // Handle dimension changes
  const handleDimensionsChange = (values: { length: number; width: number; height: number; unit: DimensionUnit }) => {
    updateData({
      length: values.length,
      width: values.width,
      height: values.height,
      dimensionUnit: values.unit,
    })
  }

  // Handle weight changes
  const handleWeightChange = (values: { weight: number; unit: WeightUnit }) => {
    updateData({
      weight: values.weight,
      weightUnit: values.unit,
    })
  }

  // Handle declared value changes
  const handleDeclaredValueChange = (values: { value: number; currency: CurrencyCode }) => {
    updateData({
      declaredValue: values.value,
      currency: values.currency,
    })
  }

  // Calculate DIM weight
  const dimWeight = calculateDIMWeight(data.length, data.width, data.height, data.dimensionUnit)

  // Convert weight to lbs for comparison
  const weightInLbs = data.weightUnit === "lbs" ? data.weight : kgToLbs(data.weight)

  return (
    <div className="border-b border-gray-200 pb-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">
          2
        </span>
        <Box className="h-5 w-5 text-blue-600" />
        Package Configuration
      </h2>

      <div className="space-y-6">
        {/* Preset Selector */}
        <PresetSelector
          onSelect={handlePresetSelect}
          selectedId={data.presetId}
        />

        {/* Package Type Selector */}
        <div className="pt-4 border-t border-gray-100">
          <PackageTypeSelector
            value={data.packageTypeId}
            onChange={handlePackageTypeChange}
            disabled={disabled}
          />
          {errors?.packageTypeId && (
            <p className="text-xs text-red-600 flex items-center gap-1 mt-2">
              <AlertCircle className="h-3 w-3" />
              {errors.packageTypeId}
            </p>
          )}
        </div>

        {/* Dimensions and Weight Row */}
        <div className="pt-4 border-t border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Dimensions Input */}
            <DimensionsInput
              length={data.length}
              width={data.width}
              height={data.height}
              unit={data.dimensionUnit}
              maxLength={maxDimensions?.length}
              maxWidth={maxDimensions?.width}
              maxHeight={maxDimensions?.height}
              onChange={handleDimensionsChange}
              disabled={disabled}
              errors={{
                length: errors?.length,
                width: errors?.width,
                height: errors?.height,
              }}
            />

            {/* Weight Input */}
            <WeightInput
              weight={data.weight}
              unit={data.weightUnit}
              dimWeight={dimWeight}
              maxWeight={currentPackageType?.maxWeight}
              onChange={handleWeightChange}
              disabled={disabled}
              error={errors?.weight}
            />
          </div>
        </div>

        {/* Declared Value */}
        <div className="pt-4 border-t border-gray-100">
          <DeclaredValueInput
            value={data.declaredValue}
            currency={data.currency}
            onChange={handleDeclaredValueChange}
            disabled={disabled}
            error={errors?.declaredValue}
          />
        </div>

        {/* Contents Description */}
        <div className="pt-4 border-t border-gray-100">
          <div className="space-y-1.5">
            <label htmlFor="contents-description" className="text-sm font-medium text-gray-700">
              Contents Description
            </label>
            <textarea
              id="contents-description"
              rows={3}
              placeholder="Describe what's inside the package (e.g., 'Office supplies and documents')"
              value={data.contentsDescription}
              onChange={(e) => updateData({ contentsDescription: e.target.value })}
              disabled={disabled}
              className={cn(
                "flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                errors?.contentsDescription && "border-red-500 focus-visible:ring-red-500"
              )}
            />
            {errors?.contentsDescription && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.contentsDescription}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export { calculateDIMWeight, kgToLbs, cmToInches }
export type { PackageConfigurationData }
