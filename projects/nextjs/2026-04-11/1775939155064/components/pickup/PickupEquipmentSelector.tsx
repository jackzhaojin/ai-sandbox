'use client'

import React from 'react'
import { Hand, Refrigerator, Shirt, Link2, Palette, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  type PickupEquipment,
  PICKUP_EQUIPMENT_OPTIONS,
} from '@/types/pickup'
import { PICKUP_EQUIPMENT_FEES } from '@/lib/validation'

const EQUIPMENT_ICONS: Record<PickupEquipment, React.ReactNode> = {
  standard_dolly: <Hand className="h-4 w-4" />,
  appliance_dolly: <Refrigerator className="h-4 w-4" />,
  furniture_pads: <Shirt className="h-4 w-4" />,
  straps: <Link2 className="h-4 w-4" />,
  pallet_jack: <Palette className="h-4 w-4" />,
  two_person_team: <Users className="h-4 w-4" />,
}

interface PickupEquipmentSelectorProps {
  value: {
    equipment: PickupEquipment[]
  }
  onChange: (value: { equipment: PickupEquipment[] }) => void
  errors?: {
    equipment?: string
  }
  disabled?: boolean
}

export function PickupEquipmentSelector({
  value,
  onChange,
  errors,
  disabled = false,
}: PickupEquipmentSelectorProps) {
  const toggleEquipment = (equipment: PickupEquipment) => {
    const newEquipment = value.equipment.includes(equipment)
      ? value.equipment.filter((e) => e !== equipment)
      : [...value.equipment, equipment]

    onChange({ equipment: newEquipment })
  }

  return (
    <div className={cn("space-y-4", disabled && "opacity-50")}>
      <div className="space-y-2">
        <Label className="text-base font-medium text-gray-900">
          Equipment & Services
        </Label>
        <p className="text-sm text-gray-500">
          Select any special equipment needed for the pickup
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {PICKUP_EQUIPMENT_OPTIONS.map((option) => {
          const isSelected = value.equipment.includes(option.id)
          const fee = PICKUP_EQUIPMENT_FEES[option.id]

          return (
            <div
              key={option.id}
              className={cn(
                "relative flex items-start gap-3 p-4 rounded-lg border-2 transition-all cursor-pointer",
                isSelected
                  ? "border-blue-500 bg-blue-50/50"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              )}
              onClick={() => !disabled && toggleEquipment(option.id)}
            >
              <div className="flex-shrink-0 pt-0.5">
                <Checkbox
                  checked={isSelected}
                  onChange={() => {}}
                  disabled={disabled}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "p-1.5 rounded",
                      isSelected
                        ? "bg-blue-100 text-blue-600"
                        : "bg-gray-100 text-gray-600"
                    )}
                  >
                    {EQUIPMENT_ICONS[option.id]}
                  </div>
                  <span className="font-medium text-gray-900 text-sm">
                    {option.label}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {option.description}
                </p>
                {fee > 0 && (
                  <span className="inline-block mt-2 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                    +${fee}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {errors?.equipment && (
        <p className="text-sm text-red-600">{errors.equipment}</p>
      )}

      {/* Info note */}
      <div className="flex items-start gap-2 text-sm text-blue-600 bg-blue-50 p-3 rounded-md">
        <Hand className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <p>
          Standard equipment (dolly, pads, straps) is included at no charge. 
          Special services like two-person teams incur additional fees.
        </p>
      </div>
    </div>
  )
}
