"use client"

import { Control, FieldErrors, UseFormSetValue } from "react-hook-form"
import { MapPin } from "lucide-react"
import { AddressInput } from "./AddressInput"
import { ContactInput } from "./ContactInput"

interface OriginSectionProps {
  control: Control<Record<string, unknown>>
  errors: FieldErrors<Record<string, unknown>>
  setValue: UseFormSetValue<Record<string, unknown>>
}

export function OriginSection({ control, errors, setValue }: OriginSectionProps) {
  return (
    <div className="border-b border-gray-200 pb-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">
          1
        </span>
        <MapPin className="h-5 w-5 text-blue-600" />
        Origin Address
      </h2>
      <div className="space-y-6">
        <AddressInput prefix="origin" control={control} errors={errors} setValue={setValue} />
        <div className="pt-4 border-t border-gray-100">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Contact Information</h3>
          <ContactInput prefix="origin" control={control} errors={errors} />
        </div>
      </div>
    </div>
  )
}
