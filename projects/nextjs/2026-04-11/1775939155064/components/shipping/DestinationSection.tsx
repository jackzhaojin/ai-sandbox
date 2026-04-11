"use client"

import { useEffect } from "react"
import { Control, FieldErrors, UseFormSetValue, UseFormWatch } from "react-hook-form"
import { Flag } from "lucide-react"
import { AddressInput } from "./AddressInput"
import { ContactInput } from "./ContactInput"
import { Checkbox } from "@/components/ui/checkbox"

interface DestinationSectionProps {
  control: Control<Record<string, unknown>>
  errors: FieldErrors<Record<string, unknown>>
  watch: UseFormWatch<Record<string, unknown>>
  setValue: UseFormSetValue<Record<string, unknown>>
  sameAsOrigin: boolean
  onSameAsOriginChange: (value: boolean) => void
}

export function DestinationSection({
  control,
  errors,
  watch,
  setValue,
  sameAsOrigin,
  onSameAsOriginChange,
}: DestinationSectionProps) {
  // Watch origin fields for copying
  const originLine1 = watch("originLine1")
  const originLine2 = watch("originLine2")
  const originCity = watch("originCity")
  const originState = watch("originState")
  const originPostal = watch("originPostal")
  const originCountry = watch("originCountry")
  const originLocationType = watch("originLocationType")
  const originName = watch("originName")
  const originCompany = watch("originCompany")
  const originPhone = watch("originPhone")
  const originExtension = watch("originExtension")
  const originEmail = watch("originEmail")

  // Copy origin values to destination when "Same as Origin" is checked
  useEffect(() => {
    if (sameAsOrigin) {
      setValue("destinationLine1", originLine1 || "", { shouldValidate: false })
      setValue("destinationLine2", originLine2 || "", { shouldValidate: false })
      setValue("destinationCity", originCity || "", { shouldValidate: false })
      setValue("destinationState", originState || "", { shouldValidate: false })
      setValue("destinationPostal", originPostal || "", { shouldValidate: false })
      setValue("destinationCountry", originCountry || "US", { shouldValidate: false })
      setValue("destinationLocationType", originLocationType || "commercial", { shouldValidate: false })
      setValue("destinationName", originName || "", { shouldValidate: false })
      setValue("destinationCompany", originCompany || "", { shouldValidate: false })
      setValue("destinationPhone", originPhone || "", { shouldValidate: false })
      setValue("destinationExtension", originExtension || "", { shouldValidate: false })
      setValue("destinationEmail", originEmail || "", { shouldValidate: false })
    }
  }, [
    sameAsOrigin,
    originLine1,
    originLine2,
    originCity,
    originState,
    originPostal,
    originCountry,
    originLocationType,
    originName,
    originCompany,
    originPhone,
    originExtension,
    originEmail,
    setValue,
  ])

  return (
    <div className="border-b border-gray-200 pb-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">
            2
          </span>
          <Flag className="h-5 w-5 text-blue-600" />
          Destination Address
        </h2>
        <div className="flex items-center">
          <Checkbox
            checked={sameAsOrigin}
            onChange={onSameAsOriginChange}
            label="Same as Origin"
          />
        </div>
      </div>

      <div className={sameAsOrigin ? "opacity-50 pointer-events-none" : ""}>
        <div className="space-y-6">
          <AddressInput prefix="destination" control={control} errors={errors} setValue={setValue} />
          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Contact Information</h3>
            <ContactInput prefix="destination" control={control} errors={errors} />
          </div>
        </div>
      </div>
    </div>
  )
}
