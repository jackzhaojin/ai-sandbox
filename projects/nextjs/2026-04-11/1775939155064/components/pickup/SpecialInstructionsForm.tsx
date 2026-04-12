'use client'

import React from 'react'
import { Lock, Car, Package, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'

interface SpecialInstructionsFormProps {
  value: {
    gateCode?: string
    parkingLoading?: string
    packageLocation?: string
    driverInstructions?: string
  }
  onChange: (value: {
    gateCode?: string
    parkingLoading?: string
    packageLocation?: string
    driverInstructions?: string
  }) => void
  errors?: {
    gateCode?: string
    parkingLoading?: string
    packageLocation?: string
    driverInstructions?: string
  }
  disabled?: boolean
}

interface TextAreaField {
  id: string
  label: string
  icon: React.ReactNode
  placeholder: string
  maxLength: number
  rows: number
  value?: string
  error?: string
  onChange: (value: string) => void
  description?: string
}

export function SpecialInstructionsForm({
  value,
  onChange,
  errors,
  disabled = false,
}: SpecialInstructionsFormProps) {
  const fields: TextAreaField[] = [
    {
      id: 'gate-code',
      label: 'Gate Code / Access',
      icon: <Lock className="h-4 w-4" />,
      placeholder: 'Gate code, buzzer number, or access instructions...',
      maxLength: 200,
      rows: 2,
      value: value.gateCode,
      error: errors?.gateCode,
      onChange: (val) => onChange({ ...value, gateCode: val }),
      description: 'Entry codes or instructions for gated/secured locations',
    },
    {
      id: 'parking-loading',
      label: 'Parking / Loading',
      icon: <Car className="h-4 w-4" />,
      placeholder: 'Parking instructions, loading dock location...',
      maxLength: 200,
      rows: 2,
      value: value.parkingLoading,
      error: errors?.parkingLoading,
      onChange: (val) => onChange({ ...value, parkingLoading: val }),
      description: 'Where to park and how to access the loading area',
    },
    {
      id: 'package-location',
      label: 'Package Location',
      icon: <Package className="h-4 w-4" />,
      placeholder: 'Where packages will be waiting (e.g., "Front desk", "Suite 200")...',
      maxLength: 100,
      rows: 1,
      value: value.packageLocation,
      error: errors?.packageLocation,
      onChange: (val) => onChange({ ...value, packageLocation: val }),
      description: 'Specific location where packages will be ready',
    },
    {
      id: 'driver-instructions',
      label: 'Driver Instructions',
      icon: <MessageSquare className="h-4 w-4" />,
      placeholder: 'Any other special instructions for the driver...',
      maxLength: 300,
      rows: 3,
      value: value.driverInstructions,
      error: errors?.driverInstructions,
      onChange: (val) => onChange({ ...value, driverInstructions: val }),
      description: 'Additional notes or special handling instructions',
    },
  ]

  return (
    <div className={cn("space-y-6", disabled && "opacity-50")}>
      <div className="space-y-2">
        <Label className="text-base font-medium text-gray-900">
          Special Instructions
        </Label>
        <p className="text-sm text-gray-500">
          Provide any additional details to help ensure a smooth pickup
        </p>
      </div>

      <div className="space-y-4">
        {fields.map((field) => (
          <div key={field.id} className="space-y-2">
            <Label
              htmlFor={field.id}
              className="flex items-center gap-2 text-sm font-medium text-gray-700"
            >
              <span
                className={cn(
                  "p-1 rounded",
                  field.value ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"
                )}
              >
                {field.icon}
              </span>
              {field.label}
            </Label>
            <textarea
              id={field.id}
              rows={field.rows}
              placeholder={field.placeholder}
              value={field.value || ''}
              onChange={(e) => field.onChange(e.target.value)}
              disabled={disabled}
              maxLength={field.maxLength}
              className={cn(
                "w-full px-3 py-2 border rounded-md text-sm",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "resize-none",
                field.error
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                  : "border-gray-300"
              )}
            />
            <div className="flex justify-between">
              <p className="text-xs text-gray-500">{field.description}</p>
              <span className="text-xs text-gray-400">
                {(field.value?.length || 0)}/{field.maxLength}
              </span>
            </div>
            {field.error && (
              <p className="text-sm text-red-600">{field.error}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
