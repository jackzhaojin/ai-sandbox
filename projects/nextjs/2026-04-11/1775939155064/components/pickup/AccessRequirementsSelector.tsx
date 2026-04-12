'use client'

import React from 'react'
import { Phone, Shield, Lock, Calendar, Car, Forklift, ArrowUpFromLine } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  type AccessRequirement,
  ACCESS_REQUIREMENT_OPTIONS,
} from '@/types/pickup'
import { ACCESS_REQUIREMENT_FEES } from '@/lib/validation'

const ACCESS_ICONS: Record<AccessRequirement, React.ReactNode> = {
  call_upon_arrival: <Phone className="h-4 w-4" />,
  security_checkin: <Shield className="h-4 w-4" />,
  gate_code: <Lock className="h-4 w-4" />,
  appointment_required: <Calendar className="h-4 w-4" />,
  limited_parking: <Car className="h-4 w-4" />,
  forklift_available: <Forklift className="h-4 w-4" />,
  liftgate_service: <ArrowUpFromLine className="h-4 w-4" />,
}

interface AccessRequirementsSelectorProps {
  value: {
    requirements: AccessRequirement[]
    gateCode?: string
    parkingInstructions?: string
  }
  onChange: (value: {
    requirements: AccessRequirement[]
    gateCode?: string
    parkingInstructions?: string
  }) => void
  errors?: {
    requirements?: string
    gateCode?: string
    parkingInstructions?: string
  }
  disabled?: boolean
}

export function AccessRequirementsSelector({
  value,
  onChange,
  errors,
  disabled = false,
}: AccessRequirementsSelectorProps) {
  const toggleRequirement = (requirement: AccessRequirement) => {
    const newRequirements = value.requirements.includes(requirement)
      ? value.requirements.filter((r) => r !== requirement)
      : [...value.requirements, requirement]

    onChange({
      requirements: newRequirements,
      gateCode: newRequirements.includes('gate_code') ? value.gateCode : undefined,
      parkingInstructions: newRequirements.includes('limited_parking')
        ? value.parkingInstructions
        : undefined,
    })
  }

  const handleGateCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({
      ...value,
      gateCode: e.target.value,
    })
  }

  const handleParkingInstructionsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({
      ...value,
      parkingInstructions: e.target.value,
    })
  }

  return (
    <div className={cn("space-y-6", disabled && "opacity-50")}>
      {/* Access Requirements Checkboxes */}
      <div className="space-y-3">
        <Label className="text-base font-medium text-gray-900">
          Access Requirements
        </Label>
        <p className="text-sm text-gray-500">
          Select any special access requirements for the pickup location
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ACCESS_REQUIREMENT_OPTIONS.map((option) => {
            const isSelected = value.requirements.includes(option.id)
            const fee = ACCESS_REQUIREMENT_FEES[option.id]

            return (
              <div
                key={option.id}
                className={cn(
                  "relative flex items-start gap-3 p-4 rounded-lg border-2 transition-all cursor-pointer",
                  isSelected
                    ? "border-blue-500 bg-blue-50/50"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                )}
                onClick={() => !disabled && toggleRequirement(option.id)}
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
                      {ACCESS_ICONS[option.id]}
                    </div>
                    <span className="font-medium text-gray-900">
                      {option.label}
                    </span>
                    {fee > 0 && (
                      <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                        +${fee}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {option.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {errors?.requirements && (
          <p className="text-sm text-red-600">{errors.requirements}</p>
        )}
      </div>

      {/* Conditional Input Fields */}
      {value.requirements.includes('gate_code') && (
        <div className="space-y-2">
          <Label htmlFor="gate-code" className="text-sm font-medium text-gray-700">
            Gate Code / Access Instructions <span className="text-red-500">*</span>
          </Label>
          <textarea
            id="gate-code"
            rows={2}
            placeholder="Enter gate code, call box number, or access instructions..."
            value={value.gateCode || ''}
            onChange={handleGateCodeChange}
            disabled={disabled}
            maxLength={200}
            className={cn(
              "w-full px-3 py-2 border rounded-md text-sm",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "resize-none",
              errors?.gateCode
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300"
            )}
          />
          <div className="flex justify-between">
            {errors?.gateCode ? (
              <p className="text-sm text-red-600">{errors.gateCode}</p>
            ) : (
              <p className="text-sm text-gray-500">
                Provide gate code or detailed access instructions for the driver
              </p>
            )}
            <span className="text-xs text-gray-400">
              {(value.gateCode?.length || 0)}/200
            </span>
          </div>
        </div>
      )}

      {value.requirements.includes('limited_parking') && (
        <div className="space-y-2">
          <Label htmlFor="parking-instructions" className="text-sm font-medium text-gray-700">
            Parking / Loading Instructions <span className="text-red-500">*</span>
          </Label>
          <textarea
            id="parking-instructions"
            rows={3}
            placeholder="Describe where the driver should park and how to access the loading area..."
            value={value.parkingInstructions || ''}
            onChange={handleParkingInstructionsChange}
            disabled={disabled}
            maxLength={200}
            className={cn(
              "w-full px-3 py-2 border rounded-md text-sm",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "resize-none",
              errors?.parkingInstructions
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300"
            )}
          />
          <div className="flex justify-between">
            {errors?.parkingInstructions ? (
              <p className="text-sm text-red-600">{errors.parkingInstructions}</p>
            ) : (
              <p className="text-sm text-gray-500">
                Provide specific parking and loading area instructions
              </p>
            )}
            <span className="text-xs text-gray-400">
              {(value.parkingInstructions?.length || 0)}/200
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
