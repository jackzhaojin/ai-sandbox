"use client"

import { useEffect } from "react"
import { Control, FieldErrors, UseFormSetValue } from "react-hook-form"
import { Building2, Copy } from "lucide-react"
import { AddressInput } from "@/components/shipping/AddressInput"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

interface BillingAddressSectionProps {
  control: Control<Record<string, unknown>>
  errors: FieldErrors<Record<string, unknown>>
  setValue: UseFormSetValue<Record<string, unknown>>
  sameAsOrigin: boolean
  onSameAsOriginChange: (value: boolean) => void
  originData?: {
    line1?: string
    line2?: string
    city?: string
    state?: string
    postal?: string
    country?: string
    locationType?: string
  }
  disabled?: boolean
}

export function BillingAddressSection({
  control,
  errors,
  setValue,
  sameAsOrigin,
  onSameAsOriginChange,
  originData,
  disabled = false,
}: BillingAddressSectionProps) {
  // Auto-fill billing address when "Same as Origin" is checked
  useEffect(() => {
    if (sameAsOrigin && originData) {
      setValue("billingLine1", originData.line1 || "", { shouldValidate: false })
      setValue("billingLine2", originData.line2 || "", { shouldValidate: false })
      setValue("billingCity", originData.city || "", { shouldValidate: false })
      setValue("billingState", originData.state || "", { shouldValidate: false })
      setValue("billingPostal", originData.postal || "", { shouldValidate: false })
      setValue("billingCountry", originData.country || "US", { shouldValidate: false })
      setValue("billingLocationType", originData.locationType || "commercial", { shouldValidate: false })
    }
  }, [sameAsOrigin, originData, setValue])

  const handleSameAsOriginChange = (checked: boolean) => {
    onSameAsOriginChange(checked)
    
    if (checked && originData) {
      // Copy origin data to billing
      setValue("billingLine1", originData.line1 || "", { shouldValidate: true })
      setValue("billingLine2", originData.line2 || "", { shouldValidate: true })
      setValue("billingCity", originData.city || "", { shouldValidate: true })
      setValue("billingState", originData.state || "", { shouldValidate: true })
      setValue("billingPostal", originData.postal || "", { shouldValidate: true })
      setValue("billingCountry", originData.country || "US", { shouldValidate: true })
      setValue("billingLocationType", originData.locationType || "commercial", { shouldValidate: true })
    } else if (!checked) {
      // Clear billing fields when unchecked
      setValue("billingLine1", "", { shouldValidate: false })
      setValue("billingLine2", "", { shouldValidate: false })
      setValue("billingCity", "", { shouldValidate: false })
      setValue("billingState", "", { shouldValidate: false })
      setValue("billingPostal", "", { shouldValidate: false })
      setValue("billingCountry", "US", { shouldValidate: false })
      setValue("billingLocationType", "commercial", { shouldValidate: false })
    }
  }

  return (
    <div className={cn("space-y-4", disabled && "opacity-60")}>
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <Building2 className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Billing Address</h3>
      </div>

      {/* Same as Origin Checkbox */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
        <Checkbox
          id="sameAsOrigin"
          checked={sameAsOrigin}
          onChange={(checked) => handleSameAsOriginChange(checked as boolean)}
          disabled={disabled}
          className="mt-0.5"
        />
        <div className="flex-1">
          <label
            htmlFor="sameAsOrigin"
            className="text-sm font-medium text-gray-900 cursor-pointer flex items-center gap-2"
          >
            <Copy className="h-4 w-4 text-blue-600" />
            Same as Origin Address
          </label>
          <p className="text-sm text-gray-600 mt-1">
            Use the same address as the shipment origin for billing purposes
          </p>
        </div>
      </div>

      {/* Address Input Form */}
      <div className={cn(
        "transition-opacity duration-200",
        sameAsOrigin && "opacity-60 pointer-events-none"
      )}>
        <AddressInput
          prefix="billing"
          control={control}
          errors={errors}
          setValue={setValue}
        />
      </div>

      {/* Visual indicator when same as origin */}
      {sameAsOrigin && originData?.line1 && (
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <p className="text-sm text-green-800">
            <span className="font-medium">Billing address copied from origin:</span>
            <br />
            {originData.line1}
            {originData.line2 && <>, {originData.line2}</>}
            <br />
            {originData.city}, {originData.state} {originData.postal}
          </p>
        </div>
      )}
    </div>
  )
}
