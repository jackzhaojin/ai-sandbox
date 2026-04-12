"use client"

import { useState, useEffect, useCallback } from "react"
import { Ruler, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export type DimensionUnit = "in" | "cm"

interface DimensionsInputProps {
  length?: number
  width?: number
  height?: number
  unit?: DimensionUnit
  maxLength?: number
  maxWidth?: number
  maxHeight?: number
  onChange: (values: { length: number; width: number; height: number; unit: DimensionUnit }) => void
  disabled?: boolean
  errors?: {
    length?: string
    width?: string
    height?: string
  }
}

// Convert inches to cm
function inchesToCm(inches: number): number {
  return Math.round(inches * 2.54 * 10) / 10
}

// Convert cm to inches
function cmToInches(cm: number): number {
  return Math.round((cm / 2.54) * 10) / 10
}

// Calculate DIM weight: L×W×H / 166 (for inches)
function calculateDIMWeight(length: number, width: number, height: number, unit: DimensionUnit): number {
  if (!length || !width || !height) return 0
  
  let volumeInCubicInches: number
  if (unit === "in") {
    volumeInCubicInches = length * width * height
  } else {
    // Convert from cm to inches first
    volumeInCubicInches = cmToInches(length) * cmToInches(width) * cmToInches(height)
  }
  
  // DIM weight divisor is 166 for domestic shipments
  const dimWeight = volumeInCubicInches / 166
  return Math.round(dimWeight * 10) / 10
}

export function DimensionsInput({
  length = 0,
  width = 0,
  height = 0,
  unit: externalUnit,
  maxLength,
  maxWidth,
  maxHeight,
  onChange,
  disabled,
  errors,
}: DimensionsInputProps) {
  // Internal unit state if not controlled externally
  const [internalUnit, setInternalUnit] = useState<DimensionUnit>("in")
  const unit = externalUnit || internalUnit

  // Local state for input values
  const [localLength, setLocalLength] = useState<string>(length ? String(length) : "")
  const [localWidth, setLocalWidth] = useState<string>(width ? String(width) : "")
  const [localHeight, setLocalHeight] = useState<string>(height ? String(height) : "")

  // Sync with external values
  useEffect(() => {
    if (length && String(length) !== localLength) {
      setLocalLength(String(length))
    }
  }, [length])

  useEffect(() => {
    if (width && String(width) !== localWidth) {
      setLocalWidth(String(width))
    }
  }, [width])

  useEffect(() => {
    if (height && String(height) !== localHeight) {
      setLocalHeight(String(height))
    }
  }, [height])

  const handleUnitChange = (newUnit: DimensionUnit) => {
    if (disabled) return
    
    // Convert current values to new unit
    const numLength = parseFloat(localLength) || 0
    const numWidth = parseFloat(localWidth) || 0
    const numHeight = parseFloat(localHeight) || 0

    if (newUnit === "cm" && unit === "in") {
      setLocalLength(numLength ? String(inchesToCm(numLength)) : "")
      setLocalWidth(numWidth ? String(inchesToCm(numWidth)) : "")
      setLocalHeight(numHeight ? String(inchesToCm(numHeight)) : "")
    } else if (newUnit === "in" && unit === "cm") {
      setLocalLength(numLength ? String(cmToInches(numLength)) : "")
      setLocalWidth(numWidth ? String(cmToInches(numWidth)) : "")
      setLocalHeight(numHeight ? String(cmToInches(numHeight)) : "")
    }

    if (!externalUnit) {
      setInternalUnit(newUnit)
    }

    onChange({
      length: parseFloat(localLength) || 0,
      width: parseFloat(localWidth) || 0,
      height: parseFloat(localHeight) || 0,
      unit: newUnit,
    })
  }

  const handleLengthChange = (value: string) => {
    setLocalLength(value)
    const numValue = parseFloat(value) || 0
    onChange({ length: numValue, width: parseFloat(localWidth) || 0, height: parseFloat(localHeight) || 0, unit })
  }

  const handleWidthChange = (value: string) => {
    setLocalWidth(value)
    const numValue = parseFloat(value) || 0
    onChange({ length: parseFloat(localLength) || 0, width: numValue, height: parseFloat(localHeight) || 0, unit })
  }

  const handleHeightChange = (value: string) => {
    setLocalHeight(value)
    const numValue = parseFloat(value) || 0
    onChange({ length: parseFloat(localLength) || 0, width: parseFloat(localWidth) || 0, height: numValue, unit })
  }

  // Calculate DIM weight
  const numLength = parseFloat(localLength) || 0
  const numWidth = parseFloat(localWidth) || 0
  const numHeight = parseFloat(localHeight) || 0
  const dimWeight = calculateDIMWeight(numLength, numWidth, numHeight, unit)

  // Check if values exceed max
  const exceedsMax = {
    length: maxLength && numLength > maxLength,
    width: maxWidth && numWidth > maxWidth,
    height: maxHeight && numHeight > maxHeight,
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Ruler className="h-4 w-4 text-gray-500" />
          <h3 className="text-sm font-medium text-gray-700">Dimensions</h3>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => handleUnitChange("in")}
            disabled={disabled}
            className={cn(
              "px-2 py-1 text-xs font-medium rounded-md transition-colors",
              unit === "in"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            in
          </button>
          <button
            type="button"
            onClick={() => handleUnitChange("cm")}
            disabled={disabled}
            className={cn(
              "px-2 py-1 text-xs font-medium rounded-md transition-colors",
              unit === "cm"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            cm
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="dimension-length" className="text-xs text-gray-600">
            Length ({unit})
          </Label>
          <Input
            id="dimension-length"
            type="number"
            min="0"
            step="0.1"
            placeholder="0"
            value={localLength}
            onChange={(e) => handleLengthChange(e.target.value)}
            disabled={disabled}
            className={cn(
              "h-9",
              errors?.length && "border-red-500 focus-visible:ring-red-500",
              exceedsMax.length && "border-amber-500 focus-visible:ring-amber-500"
            )}
          />
          {errors?.length && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.length}
            </p>
          )}
          {exceedsMax.length && !errors?.length && (
            <p className="text-xs text-amber-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Max: {maxLength}{unit}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="dimension-width" className="text-xs text-gray-600">
            Width ({unit})
          </Label>
          <Input
            id="dimension-width"
            type="number"
            min="0"
            step="0.1"
            placeholder="0"
            value={localWidth}
            onChange={(e) => handleWidthChange(e.target.value)}
            disabled={disabled}
            className={cn(
              "h-9",
              errors?.width && "border-red-500 focus-visible:ring-red-500",
              exceedsMax.width && "border-amber-500 focus-visible:ring-amber-500"
            )}
          />
          {errors?.width && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.width}
            </p>
          )}
          {exceedsMax.width && !errors?.width && (
            <p className="text-xs text-amber-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Max: {maxWidth}{unit}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="dimension-height" className="text-xs text-gray-600">
            Height ({unit})
          </Label>
          <Input
            id="dimension-height"
            type="number"
            min="0"
            step="0.1"
            placeholder="0"
            value={localHeight}
            onChange={(e) => handleHeightChange(e.target.value)}
            disabled={disabled}
            className={cn(
              "h-9",
              errors?.height && "border-red-500 focus-visible:ring-red-500",
              exceedsMax.height && "border-amber-500 focus-visible:ring-amber-500"
            )}
          />
          {errors?.height && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.height}
            </p>
          )}
          {exceedsMax.height && !errors?.height && (
            <p className="text-xs text-amber-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Max: {maxHeight}{unit}
            </p>
          )}
        </div>
      </div>

      {/* DIM Weight Calculation */}
      {dimWeight > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-blue-700 font-medium">DIM Weight (billable)</span>
            <span className="text-sm font-semibold text-blue-900">{dimWeight} lbs</span>
          </div>
          <p className="text-xs text-blue-600 mt-1">
            Calculated as L×W×H÷166 ({numLength}×{numWidth}×{numHeight}÷166)
          </p>
        </div>
      )}
    </div>
  )
}

export { calculateDIMWeight, inchesToCm, cmToInches }
export type { DimensionUnit }
