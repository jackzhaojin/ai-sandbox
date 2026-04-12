'use client'

import React from 'react'
import { User, HandHelping, Truck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import {
  type LoadingAssistanceType,
  LOADING_ASSISTANCE_OPTIONS,
} from '@/types/pickup'
import { LOADING_ASSISTANCE_FEES } from '@/lib/validation'

const LOADING_ICONS: Record<LoadingAssistanceType, React.ReactNode> = {
  customer_load: <User className="h-5 w-5" />,
  driver_assistance: <HandHelping className="h-5 w-5" />,
  full_service: <Truck className="h-5 w-5" />,
}

interface LoadingAssistanceSelectorProps {
  value: {
    assistanceType: LoadingAssistanceType | null
  }
  onChange: (value: { assistanceType: LoadingAssistanceType }) => void
  errors?: {
    assistanceType?: string
  }
  disabled?: boolean
}

export function LoadingAssistanceSelector({
  value,
  onChange,
  errors,
  disabled = false,
}: LoadingAssistanceSelectorProps) {
  const handleChange = (assistanceType: string) => {
    onChange({ assistanceType: assistanceType as LoadingAssistanceType })
  }

  return (
    <div className={cn("space-y-4", disabled && "opacity-50")}>
      <div className="space-y-2">
        <Label className="text-base font-medium text-gray-900">
          Loading Assistance
        </Label>
        <p className="text-sm text-gray-500">
          Choose who will load the packages onto the truck
        </p>
      </div>

      <RadioGroup
        value={value.assistanceType || undefined}
        onChange={handleChange}
        className="grid grid-cols-1 md:grid-cols-3 gap-3"
      >
        {LOADING_ASSISTANCE_OPTIONS.map((option) => {
          const fee = LOADING_ASSISTANCE_FEES[option.id]
          return (
            <RadioGroupItem
              key={option.id}
              value={option.id}
              disabled={disabled}
              label={
                <div className="flex flex-col items-center text-center py-2">
                  <div
                    className={cn(
                      "p-2 rounded-lg mb-2",
                      value.assistanceType === option.id
                        ? "bg-blue-100 text-blue-600"
                        : "bg-gray-100 text-gray-600"
                    )}
                  >
                    {LOADING_ICONS[option.id]}
                  </div>
                  <span className="font-medium text-gray-900">
                    {option.label}
                  </span>
                  <p className="text-sm text-gray-500 mt-1">
                    {option.description}
                  </p>
                  <span
                    className={cn(
                      "mt-2 text-xs font-medium px-2 py-0.5 rounded",
                      fee === 0
                        ? "text-green-700 bg-green-50"
                        : "text-amber-700 bg-amber-50"
                    )}
                  >
                    {fee === 0 ? 'Free' : `+$${fee}`}
                  </span>
                </div>
              }
              className={cn(
                "p-4 rounded-lg border-2 transition-all",
                value.assistanceType === option.id
                  ? "border-blue-500 bg-blue-50/50"
                  : "border-gray-200 hover:border-gray-300",
                disabled && "cursor-not-allowed"
              )}
            />
          )
        })}
      </RadioGroup>

      {errors?.assistanceType && (
        <p className="text-sm text-red-600">{errors.assistanceType}</p>
      )}

      {/* Info note */}
      <div className="flex items-start gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
        <HandHelping className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <p>
          <strong>Safety note:</strong> For items over 70 lbs, we recommend either 
          Driver Assistance or Full Service to prevent injury.
        </p>
      </div>
    </div>
  )
}
