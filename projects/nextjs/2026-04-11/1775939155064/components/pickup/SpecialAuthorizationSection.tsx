'use client'

import React from 'react'
import { Shield, FileCheck, Signature, Camera, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { type SpecialAuthorizationDetails } from '@/types/pickup'

interface SpecialAuthorizationSectionProps {
  value: SpecialAuthorizationDetails
  onChange: (value: SpecialAuthorizationDetails) => void
  declaredValue: number
  currency?: string
  disabled?: boolean
}

const HIGH_VALUE_THRESHOLD = 5000

export function SpecialAuthorizationSection({
  value,
  onChange,
  declaredValue,
  currency = 'USD',
  disabled = false,
}: SpecialAuthorizationSectionProps) {
  const isHighValue = declaredValue > HIGH_VALUE_THRESHOLD

  const handleCheckboxChange = (
    field: keyof SpecialAuthorizationDetails,
    checked: boolean
  ) => {
    onChange({ ...value, [field]: checked })
  }

  // If not high-value, don't render anything (or show a minimal state)
  if (!isHighValue) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-gray-400 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-gray-700">
              Standard Authorization
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Declared value is ${HIGH_VALUE_THRESHOLD.toLocaleString()} {currency} or less.
              Standard pickup procedures apply.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', disabled && 'opacity-50')}>
      {/* High Value Alert */}
      <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-900">
              High-Value Shipment Detected
            </p>
            <p className="text-sm text-amber-800 mt-1">
              Declared value: <strong>${declaredValue.toLocaleString()} {currency}</strong>
              {' '}exceeds ${HIGH_VALUE_THRESHOLD.toLocaleString()} {currency}.
              Additional security measures are recommended.
            </p>
          </div>
        </div>
      </div>

      {/* Special Authorization Options */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5 text-blue-600" />
          <h3 className="text-base font-semibold text-gray-900">
            Enhanced Security Options
          </h3>
        </div>

        {/* ID Verification */}
        <div className="flex items-start gap-3">
          <Checkbox
            id="id-verification"
            checked={value.idVerificationRequired}
            onChange={(checked) =>
              handleCheckboxChange('idVerificationRequired', checked)
            }
            disabled={disabled}
            className="mt-1"
          />
          <div className="flex-1">
            <Label
              htmlFor="id-verification"
              className="flex items-center gap-2 text-sm font-medium text-gray-900 cursor-pointer"
            >
              <FileCheck className="h-4 w-4 text-blue-600" />
              Require Government-Issued ID Verification
            </Label>
            <p className="text-sm text-gray-500 mt-1">
              Driver will verify the identity of the person releasing the shipment
              against a valid government-issued photo ID (driver's license, passport, etc.).
            </p>
          </div>
        </div>

        {/* Signature Required */}
        <div className="flex items-start gap-3">
          <Checkbox
            id="signature-required"
            checked={value.signatureRequired}
            onChange={(checked) =>
              handleCheckboxChange('signatureRequired', checked)
            }
            disabled={disabled}
            className="mt-1"
          />
          <div className="flex-1">
            <Label
              htmlFor="signature-required"
              className="flex items-center gap-2 text-sm font-medium text-gray-900 cursor-pointer"
            >
              <Signature className="h-4 w-4 text-blue-600" />
              Require Physical Signature
            </Label>
            <p className="text-sm text-gray-500 mt-1">
              A physical signature from the authorized person will be captured
              on the driver's handheld device at time of pickup.
            </p>
          </div>
        </div>

        {/* Photo ID Matching */}
        <div className="flex items-start gap-3">
          <Checkbox
            id="photo-id-matching"
            checked={value.photoIdMatching}
            onChange={(checked) =>
              handleCheckboxChange('photoIdMatching', checked)
            }
            disabled={disabled}
            className="mt-1"
          />
          <div className="flex-1">
            <Label
              htmlFor="photo-id-matching"
              className="flex items-center gap-2 text-sm font-medium text-gray-900 cursor-pointer"
            >
              <Camera className="h-4 w-4 text-blue-600" />
              Enable Photo ID Matching
            </Label>
            <p className="text-sm text-gray-500 mt-1">
              Driver will photograph the ID presented and it will be matched
              against the authorized personnel list. Recommended for very high-value shipments.
            </p>
          </div>
        </div>
      </div>

      {/* Summary of selected options */}
      {(value.idVerificationRequired || value.signatureRequired || value.photoIdMatching) && (
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <p className="text-sm font-medium text-green-900">
            Security Measures Enabled:
          </p>
          <ul className="mt-2 space-y-1">
            {value.idVerificationRequired && (
              <li className="text-sm text-green-800 flex items-center gap-2">
                <FileCheck className="h-3.5 w-3.5" />
                Government ID verification required
              </li>
            )}
            {value.signatureRequired && (
              <li className="text-sm text-green-800 flex items-center gap-2">
                <Signature className="h-3.5 w-3.5" />
                Physical signature required
              </li>
            )}
            {value.photoIdMatching && (
              <li className="text-sm text-green-800 flex items-center gap-2">
                <Camera className="h-3.5 w-3.5" />
                Photo ID matching enabled
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
