'use client'

import React from 'react'
import { Building2, Home, Warehouse, HardHat, Package, Store } from 'lucide-react'
import { cn } from '@/lib/utils'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  type PickupLocationType,
  PICKUP_LOCATION_TYPE_OPTIONS,
} from '@/types/pickup'
import { PICKUP_LOCATION_TYPE_FEES } from '@/lib/validation'

const LOCATION_ICONS: Record<PickupLocationType, React.ReactNode> = {
  loading_dock: <Building2 className="h-5 w-5" />,
  ground_level: <Store className="h-5 w-5" />,
  residential: <Home className="h-5 w-5" />,
  storage_facility: <Warehouse className="h-5 w-5" />,
  construction_site: <HardHat className="h-5 w-5" />,
  other: <Package className="h-5 w-5" />,
}

interface PickupLocationFormProps {
  value: {
    locationType: PickupLocationType | null
    dockNumber?: string
    otherDescription?: string
  }
  onChange: (value: {
    locationType: PickupLocationType
    dockNumber?: string
    otherDescription?: string
  }) => void
  errors?: {
    locationType?: string
    dockNumber?: string
    otherDescription?: string
  }
  disabled?: boolean
}

export function PickupLocationForm({
  value,
  onChange,
  errors,
  disabled = false,
}: PickupLocationFormProps) {
  const handleLocationTypeChange = (locationType: string) => {
    onChange({
      locationType: locationType as PickupLocationType,
      dockNumber: locationType === 'loading_dock' ? value.dockNumber : undefined,
      otherDescription: locationType === 'other' ? value.otherDescription : undefined,
    })
  }

  const handleDockNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (value.locationType) {
      onChange({
        ...value,
        locationType: value.locationType,
        dockNumber: e.target.value,
      })
    }
  }

  const handleOtherDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (value.locationType) {
      onChange({
        ...value,
        locationType: value.locationType,
        otherDescription: e.target.value,
      })
    }
  }

  return (
    <div className={cn("space-y-6", disabled && "opacity-50")}>
      {/* Location Type Selection */}
      <div className="space-y-3">
        <Label className="text-base font-medium text-gray-900">
          Pickup Location Type
        </Label>
        <p className="text-sm text-gray-500">
          Select the type of location where the pickup will occur
        </p>

        <RadioGroup
          value={value.locationType || undefined}
          onChange={handleLocationTypeChange}
          className="grid grid-cols-1 md:grid-cols-2 gap-3"
        >
          {PICKUP_LOCATION_TYPE_OPTIONS.map((option) => {
            const fee = PICKUP_LOCATION_TYPE_FEES[option.id]
            return (
              <RadioGroupItem
                key={option.id}
                value={option.id}
                disabled={disabled}
                label={
                  <div className="flex items-start gap-3 py-1">
                    <div
                      className={cn(
                        "p-2 rounded-lg",
                        value.locationType === option.id
                          ? "bg-blue-100 text-blue-600"
                          : "bg-gray-100 text-gray-600"
                      )}
                    >
                      {LOCATION_ICONS[option.id]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {option.label}
                        </span>
                        {fee > 0 && (
                          <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                            +${fee}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {option.description}
                      </p>
                    </div>
                  </div>
                }
                className={cn(
                  "p-4 rounded-lg border-2 transition-all",
                  value.locationType === option.id
                    ? "border-blue-500 bg-blue-50/50"
                    : "border-gray-200 hover:border-gray-300",
                  disabled && "cursor-not-allowed"
                )}
              />
            )
          })}
        </RadioGroup>

        {errors?.locationType && (
          <p className="text-sm text-red-600">{errors.locationType}</p>
        )}
      </div>

      {/* Conditional Fields */}
      {value.locationType === 'loading_dock' && (
        <div className="space-y-2">
          <Label htmlFor="dock-number" className="text-sm font-medium text-gray-700">
            Dock Number <span className="text-red-500">*</span>
          </Label>
          <Input
            id="dock-number"
            type="text"
            placeholder="e.g., Dock 3, Bay B"
            value={value.dockNumber || ''}
            onChange={handleDockNumberChange}
            disabled={disabled}
            className={cn(
              "max-w-xs",
              errors?.dockNumber && "border-red-500 focus:border-red-500 focus:ring-red-500"
            )}
          />
          {errors?.dockNumber ? (
            <p className="text-sm text-red-600">{errors.dockNumber}</p>
          ) : (
            <p className="text-sm text-gray-500">
              Enter the dock number or bay where the driver should arrive
            </p>
          )}
        </div>
      )}

      {value.locationType === 'other' && (
        <div className="space-y-2">
          <Label htmlFor="other-description" className="text-sm font-medium text-gray-700">
            Location Description <span className="text-red-500">*</span>
          </Label>
          <textarea
            id="other-description"
            rows={3}
            placeholder="Describe the pickup location..."
            value={value.otherDescription || ''}
            onChange={handleOtherDescriptionChange}
            disabled={disabled}
            maxLength={200}
            className={cn(
              "w-full px-3 py-2 border rounded-md text-sm",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "resize-none",
              errors?.otherDescription
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300"
            )}
          />
          <div className="flex justify-between">
            {errors?.otherDescription ? (
              <p className="text-sm text-red-600">{errors.otherDescription}</p>
            ) : (
              <p className="text-sm text-gray-500">
                Please describe the location so our driver can find it
              </p>
            )}
            <span className="text-xs text-gray-400">
              {(value.otherDescription?.length || 0)}/200
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
