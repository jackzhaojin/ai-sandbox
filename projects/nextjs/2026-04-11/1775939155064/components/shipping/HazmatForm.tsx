"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { AlertTriangle, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Hazard classes for dangerous goods
export const hazardClasses = [
  { id: "1", name: "Class 1 - Explosives", description: "Explosive substances and articles" },
  { id: "2", name: "Class 2 - Gases", description: "Compressed, liquefied, or dissolved gases" },
  { id: "3", name: "Class 3 - Flammable Liquids", description: "Liquids with flash point below 60°C" },
  { id: "4", name: "Class 4 - Flammable Solids", description: "Solid substances liable to spontaneous combustion" },
  { id: "5", name: "Class 5 - Oxidizing Substances", description: "Oxidizing substances and organic peroxides" },
  { id: "6", name: "Class 6 - Toxic Substances", description: "Toxic and infectious substances" },
  { id: "7", name: "Class 7 - Radioactive Material", description: "Radioactive substances" },
  { id: "8", name: "Class 8 - Corrosive Substances", description: "Substances which cause severe damage to living tissue" },
  { id: "9", name: "Class 9 - Miscellaneous", description: "Miscellaneous dangerous substances and articles" },
]

export const packingGroups = [
  { id: "I", name: "Packing Group I - High Danger", description: "Substances presenting high danger" },
  { id: "II", name: "Packing Group II - Medium Danger", description: "Substances presenting medium danger" },
  { id: "III", name: "Packing Group III - Low Danger", description: "Substances presenting low danger" },
]

export interface HazmatData {
  unNumber: string
  properShippingName: string
  hazardClass: string
  packingGroup: string
  quantity: number
  unit: string
  emergencyContactName: string
  emergencyContactPhone: string
}

interface HazmatFormProps {
  value?: Partial<HazmatData>
  onChange: (data: HazmatData) => void
  disabled?: boolean
  errors?: {
    unNumber?: string
    properShippingName?: string
    hazardClass?: string
    packingGroup?: string
    quantity?: string
    emergencyContactName?: string
    emergencyContactPhone?: string
  }
}

const defaultHazmatData: HazmatData = {
  unNumber: "",
  properShippingName: "",
  hazardClass: "",
  packingGroup: "",
  quantity: 0,
  unit: "kg",
  emergencyContactName: "",
  emergencyContactPhone: "",
}

export function HazmatForm({
  value,
  onChange,
  disabled,
  errors,
}: HazmatFormProps) {
  const [data, setData] = useState<HazmatData>({
    ...defaultHazmatData,
    ...value,
  })

  // Use refs to prevent infinite loops
  const isInitialRender = useRef(true)
  const prevDataRef = useRef(JSON.stringify(data))

  // Sync with external values
  useEffect(() => {
    if (value) {
      setData((prev) => ({ ...prev, ...value }))
    }
  }, [])

  // Call onChange when data changes
  useEffect(() => {
    const currentDataJson = JSON.stringify(data)

    // Skip initial render
    if (isInitialRender.current) {
      isInitialRender.current = false
      prevDataRef.current = currentDataJson
      return
    }

    // Only call onChange if data actually changed
    if (prevDataRef.current !== currentDataJson) {
      prevDataRef.current = currentDataJson
      onChange(data)
    }
  }, [data, onChange])

  const updateField = useCallback(<K extends keyof HazmatData>(
    field: K,
    value: HazmatData[K]
  ) => {
    setData((prev) => ({ ...prev, [field]: value }))
  }, [])

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-amber-900">Hazardous Materials Declaration</h4>
          <p className="text-sm text-amber-700 mt-1">
            Complete all required fields below. Hazmat shipments require additional documentation and may be subject to restrictions.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* UN Number */}
        <div className="space-y-1.5">
          <Label htmlFor="hazmat-un-number" className="text-sm font-medium text-gray-700">
            UN Number <span className="text-red-500">*</span>
          </Label>
          <Input
            id="hazmat-un-number"
            placeholder="e.g., UN1203"
            value={data.unNumber}
            onChange={(e) => updateField("unNumber", e.target.value)}
            disabled={disabled}
            className={cn(
              "uppercase",
              errors?.unNumber && "border-red-500 focus-visible:ring-red-500"
            )}
          />
          {errors?.unNumber ? (
            <p className="text-xs text-red-600">{errors.unNumber}</p>
          ) : (
            <p className="text-xs text-gray-500">
              4-digit UN identification number (e.g., UN1203 for gasoline)
            </p>
          )}
        </div>

        {/* Proper Shipping Name */}
        <div className="space-y-1.5">
          <Label htmlFor="hazmat-shipping-name" className="text-sm font-medium text-gray-700">
            Proper Shipping Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="hazmat-shipping-name"
            placeholder="e.g., Gasoline"
            value={data.properShippingName}
            onChange={(e) => updateField("properShippingName", e.target.value)}
            disabled={disabled}
            className={cn(
              errors?.properShippingName && "border-red-500 focus-visible:ring-red-500"
            )}
          />
          {errors?.properShippingName && (
            <p className="text-xs text-red-600">{errors.properShippingName}</p>
          )}
        </div>

        {/* Hazard Class */}
        <div className="space-y-1.5">
          <Label htmlFor="hazmat-class" className="text-sm font-medium text-gray-700">
            Hazard Class <span className="text-red-500">*</span>
          </Label>
          <select
            id="hazmat-class"
            value={data.hazardClass}
            onChange={(e) => updateField("hazardClass", e.target.value)}
            disabled={disabled}
            className={cn(
              "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              errors?.hazardClass && "border-red-500 focus-visible:ring-red-500"
            )}
          >
            <option value="">Select hazard class...</option>
            {hazardClasses.map((hc) => (
              <option key={hc.id} value={hc.id}>
                {hc.name}
              </option>
            ))}
          </select>
          {errors?.hazardClass && (
            <p className="text-xs text-red-600">{errors.hazardClass}</p>
          )}
        </div>

        {/* Packing Group */}
        <div className="space-y-1.5">
          <Label htmlFor="hazmat-packing-group" className="text-sm font-medium text-gray-700">
            Packing Group <span className="text-red-500">*</span>
          </Label>
          <select
            id="hazmat-packing-group"
            value={data.packingGroup}
            onChange={(e) => updateField("packingGroup", e.target.value)}
            disabled={disabled}
            className={cn(
              "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              errors?.packingGroup && "border-red-500 focus-visible:ring-red-500"
            )}
          >
            <option value="">Select packing group...</option>
            {packingGroups.map((pg) => (
              <option key={pg.id} value={pg.id}>
                {pg.name}
              </option>
            ))}
          </select>
          {errors?.packingGroup && (
            <p className="text-xs text-red-600">{errors.packingGroup}</p>
          )}
        </div>

        {/* Quantity */}
        <div className="space-y-1.5">
          <Label htmlFor="hazmat-quantity" className="text-sm font-medium text-gray-700">
            Quantity <span className="text-red-500">*</span>
          </Label>
          <div className="flex gap-2">
            <Input
              id="hazmat-quantity"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={data.quantity || ""}
              onChange={(e) => updateField("quantity", parseFloat(e.target.value) || 0)}
              disabled={disabled}
              className={cn(
                errors?.quantity && "border-red-500 focus-visible:ring-red-500"
              )}
            />
            <select
              value={data.unit}
              onChange={(e) => updateField("unit", e.target.value)}
              disabled={disabled}
              className="h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="kg">kg</option>
              <option value="lbs">lbs</option>
              <option value="L">L</option>
              <option value="gal">gal</option>
            </select>
          </div>
          {errors?.quantity && (
            <p className="text-xs text-red-600">{errors.quantity}</p>
          )}
        </div>

        {/* Emergency Contact Name */}
        <div className="space-y-1.5">
          <Label htmlFor="hazmat-emergency-name" className="text-sm font-medium text-gray-700">
            Emergency Contact Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="hazmat-emergency-name"
            placeholder="Full name"
            value={data.emergencyContactName}
            onChange={(e) => updateField("emergencyContactName", e.target.value)}
            disabled={disabled}
            className={cn(
              errors?.emergencyContactName && "border-red-500 focus-visible:ring-red-500"
            )}
          />
          {errors?.emergencyContactName && (
            <p className="text-xs text-red-600">{errors.emergencyContactName}</p>
          )}
        </div>

        {/* Emergency Contact Phone */}
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="hazmat-emergency-phone" className="text-sm font-medium text-gray-700">
            Emergency Contact Phone <span className="text-red-500">*</span>
          </Label>
          <Input
            id="hazmat-emergency-phone"
            type="tel"
            placeholder="+1 (555) 123-4567"
            value={data.emergencyContactPhone}
            onChange={(e) => updateField("emergencyContactPhone", e.target.value)}
            disabled={disabled}
            className={cn(
              errors?.emergencyContactPhone && "border-red-500 focus-visible:ring-red-500"
            )}
          />
          {errors?.emergencyContactPhone ? (
            <p className="text-xs text-red-600">{errors.emergencyContactPhone}</p>
          ) : (
            <p className="text-xs text-gray-500">
              24/7 emergency contact number for hazmat incidents
            </p>
          )}
        </div>
      </div>

      <div className="flex items-start gap-2 bg-white/50 rounded p-3 text-sm">
        <Info className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-amber-800">
          By submitting this form, you certify that all hazardous material information is accurate and complete. 
          False or incomplete declarations may result in fines, shipment delays, or refusal of service.
        </p>
      </div>
    </div>
  )
}

export type { HazmatFormProps }
