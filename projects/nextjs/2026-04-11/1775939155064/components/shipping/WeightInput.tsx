"use client"

import { useState, useEffect } from "react"
import { Scale, AlertTriangle, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export type WeightUnit = "lbs" | "kg"

interface WeightInputProps {
  weight?: number
  unit?: WeightUnit
  dimWeight?: number // in lbs
  maxWeight?: number // in kg (from package type)
  onChange: (values: { weight: number; unit: WeightUnit }) => void
  disabled?: boolean
  error?: string
}

// Convert kg to lbs
function kgToLbs(kg: number): number {
  return Math.round(kg * 2.20462 * 10) / 10
}

// Convert lbs to kg
function lbsToKg(lbs: number): number {
  return Math.round((lbs / 2.20462) * 10) / 10
}

export function WeightInput({
  weight = 0,
  unit: externalUnit,
  dimWeight = 0,
  maxWeight,
  onChange,
  disabled,
  error,
}: WeightInputProps) {
  // Internal unit state if not controlled externally
  const [internalUnit, setInternalUnit] = useState<WeightUnit>("lbs")
  const unit = externalUnit || internalUnit

  // Local state for input value
  const [localWeight, setLocalWeight] = useState<string>(weight ? String(weight) : "")

  // Sync with external values
  useEffect(() => {
    if (weight && String(weight) !== localWeight) {
      setLocalWeight(String(weight))
    }
  }, [weight])

  const handleUnitChange = (newUnit: WeightUnit) => {
    if (disabled) return

    // Convert current value to new unit
    const numWeight = parseFloat(localWeight) || 0

    if (newUnit === "kg" && unit === "lbs") {
      setLocalWeight(numWeight ? String(lbsToKg(numWeight)) : "")
    } else if (newUnit === "lbs" && unit === "kg") {
      setLocalWeight(numWeight ? String(kgToLbs(numWeight)) : "")
    }

    if (!externalUnit) {
      setInternalUnit(newUnit)
    }

    onChange({
      weight: parseFloat(localWeight) || 0,
      unit: newUnit,
    })
  }

  const handleWeightChange = (value: string) => {
    setLocalWeight(value)
    const numValue = parseFloat(value) || 0
    onChange({ weight: numValue, unit })
  }

  const numWeight = parseFloat(localWeight) || 0
  
  // Convert to lbs for comparison
  const weightInLbs = unit === "lbs" ? numWeight : kgToLbs(numWeight)
  
  // Determine billable weight (greater of actual or DIM)
  const billableWeight = Math.max(weightInLbs, dimWeight)
  
  // Check if DIM weight applies
  const dimApplies = dimWeight > weightInLbs && dimWeight > 0
  
  // Check if exceeds max weight
  const maxWeightLbs = maxWeight ? kgToLbs(maxWeight) : null
  const exceedsMax = maxWeightLbs && weightInLbs > maxWeightLbs

  // Convert display values
  const displayActual = unit === "lbs" ? weightInLbs : numWeight
  const displayDIM = unit === "lbs" ? dimWeight : lbsToKg(dimWeight)
  const displayBillable = unit === "lbs" ? billableWeight : lbsToKg(billableWeight)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-gray-500" />
          <Label htmlFor="package-weight" className="text-sm font-medium text-gray-700">
            Actual Weight
          </Label>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => handleUnitChange("lbs")}
            disabled={disabled}
            className={cn(
              "px-2 py-1 text-xs font-medium rounded-md transition-colors",
              unit === "lbs"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            lbs
          </button>
          <button
            type="button"
            onClick={() => handleUnitChange("kg")}
            disabled={disabled}
            className={cn(
              "px-2 py-1 text-xs font-medium rounded-md transition-colors",
              unit === "kg"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            kg
          </button>
        </div>
      </div>

      <Input
        id="package-weight"
        type="number"
        min="0"
        step="0.1"
        placeholder={`Enter weight in ${unit}`}
        value={localWeight}
        onChange={(e) => handleWeightChange(e.target.value)}
        disabled={disabled}
        className={cn(
          "h-10",
          error && "border-red-500 focus-visible:ring-red-500",
          exceedsMax && "border-amber-500 focus-visible:ring-amber-500"
        )}
      />

      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          {error}
        </p>
      )}

      {exceedsMax && !error && (
        <p className="text-xs text-amber-600 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Exceeds max weight for package type ({Math.round(maxWeightLbs || 0)} lbs)
        </p>
      )}

      {/* Weight Summary */}
      {(numWeight > 0 || dimWeight > 0) && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
            <Info className="h-3 w-3" />
            <span>Weight Summary</span>
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-white rounded p-2 border border-gray-200">
              <div className="text-xs text-gray-500">Actual</div>
              <div className="text-sm font-medium text-gray-900">
                {displayActual > 0 ? displayActual.toFixed(1) : "—"} {unit}
              </div>
            </div>
            <div className="bg-white rounded p-2 border border-gray-200">
              <div className="text-xs text-gray-500">DIM</div>
              <div className={cn(
                "text-sm font-medium",
                dimApplies ? "text-amber-600" : "text-gray-900"
              )}>
                {displayDIM > 0 ? displayDIM.toFixed(1) : "—"} {unit}
              </div>
            </div>
            <div className={cn(
              "rounded p-2 border",
              dimApplies 
                ? "bg-amber-50 border-amber-200" 
                : "bg-blue-50 border-blue-200"
            )}>
              <div className={cn(
                "text-xs",
                dimApplies ? "text-amber-600" : "text-blue-600"
              )}>Billable</div>
              <div className={cn(
                "text-sm font-semibold",
                dimApplies ? "text-amber-700" : "text-blue-700"
              )}>
                {displayBillable > 0 ? displayBillable.toFixed(1) : "—"} {unit}
              </div>
            </div>
          </div>

          {dimApplies && (
            <div className="flex items-start gap-1.5 text-xs text-amber-700 bg-amber-100 rounded p-2">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>
                DIM weight applies. Shipping cost will be based on dimensional weight 
                ({dimWeight.toFixed(1)} lbs) instead of actual weight.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export { kgToLbs, lbsToKg }
export type { WeightUnit }
