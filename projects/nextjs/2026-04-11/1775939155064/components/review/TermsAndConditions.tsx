'use client'

import React from 'react'
import { FileText, ExternalLink, Shield, Package, AlertTriangle, Truck } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

export interface TermsAcceptance {
  declaredValueAccurate: boolean
  insuranceUnderstood: boolean
  contentsCompliant: boolean
  carrierAuthorized: boolean
  hazmatCertification?: boolean
}

export interface TermsAndConditionsProps {
  accepted: TermsAcceptance
  onChange: (terms: TermsAcceptance) => void
  declaredValue?: number
  hasHazmat?: boolean
  className?: string
}

const TERMS_LINKS = {
  fullTerms: '/terms-and-conditions',
  shippingConditions: '/shipping-conditions',
  hazmatGuidelines: '/hazmat-guidelines',
  insurancePolicy: '/insurance-policy',
  prohibitedItems: '/prohibited-items',
}

export function TermsAndConditions({
  accepted,
  onChange,
  declaredValue = 0,
  hasHazmat = false,
  className,
}: TermsAndConditionsProps) {
  const needsInsuranceAcknowledgment = declaredValue >= 2500

  const handleCheckboxChange = (key: keyof TermsAcceptance, value: boolean) => {
    onChange({
      ...accepted,
      [key]: value,
    })
  }

  const allRequiredAccepted = hasHazmat
    ? accepted.declaredValueAccurate &&
      accepted.insuranceUnderstood &&
      accepted.contentsCompliant &&
      accepted.carrierAuthorized &&
      accepted.hazmatCertification
    : accepted.declaredValueAccurate &&
      accepted.insuranceUnderstood &&
      accepted.contentsCompliant &&
      accepted.carrierAuthorized

  return (
    <div className={cn('bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden', className)}>
      {/* Header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Shield className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Terms & Conditions</h3>
            <p className="text-sm text-gray-600">
              Please review and accept all required terms before submitting your shipment
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Progress indicator */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full transition-all duration-300',
                allRequiredAccepted ? 'bg-green-500 w-full' : 'bg-blue-500',
                !accepted.declaredValueAccurate && 'w-0',
                accepted.declaredValueAccurate && !accepted.insuranceUnderstood && 'w-1/4',
                accepted.declaredValueAccurate && accepted.insuranceUnderstood && !accepted.contentsCompliant && 'w-2/4',
                accepted.declaredValueAccurate && accepted.insuranceUnderstood && accepted.contentsCompliant && !accepted.carrierAuthorized && 'w-3/4',
                accepted.declaredValueAccurate && accepted.insuranceUnderstood && accepted.contentsCompliant && accepted.carrierAuthorized && !allRequiredAccepted && 'w-4/5'
              )}
            />
          </div>
          <span className="text-sm font-medium text-gray-600 min-w-[3rem]">
            {[
              accepted.declaredValueAccurate,
              accepted.insuranceUnderstood,
              accepted.contentsCompliant,
              accepted.carrierAuthorized,
              ...(hasHazmat ? [accepted.hazmatCertification] : []),
            ].filter(Boolean).length}
            /{hasHazmat ? 5 : 4}
          </span>
        </div>

        {/* Checkbox 1: Declared Value Accurate */}
        <div className="flex gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
          <div className="pt-0.5">
            <Checkbox
              id="declaredValueAccurate"
              checked={accepted.declaredValueAccurate}
              onChange={(checked) => handleCheckboxChange('declaredValueAccurate', checked)}
            />
          </div>
          <div className="flex-1">
            <label
              htmlFor="declaredValueAccurate"
              className="text-sm font-medium text-gray-900 cursor-pointer"
            >
              Declared Value Accurate
            </label>
            <p className="text-sm text-gray-600 mt-1">
              I certify that the declared value of{' '}
              <span className="font-medium text-gray-900">
                ${declaredValue.toLocaleString()}
              </span>{' '}
              accurately represents the actual value of the contents. I understand that
              misrepresentation may result in denied claims and additional fees.
            </p>
          </div>
          <Package className="h-5 w-5 text-gray-400 shrink-0" />
        </div>

        {/* Checkbox 2: Insurance Understood (if $2500+) */}
        {needsInsuranceAcknowledgment && (
          <div className="flex gap-3 p-4 bg-amber-50 rounded-lg border border-amber-100">
            <div className="pt-0.5">
              <Checkbox
                id="insuranceUnderstood"
                checked={accepted.insuranceUnderstood}
                onChange={(checked) => handleCheckboxChange('insuranceUnderstood', checked)}
              />
            </div>
            <div className="flex-1">
              <label
                htmlFor="insuranceUnderstood"
                className="text-sm font-medium text-gray-900 cursor-pointer"
              >
                High-Value Shipment Insurance Acknowledgment
              </label>
              <p className="text-sm text-gray-600 mt-1">
                I understand that this shipment has a declared value of ${declaredValue.toLocaleString()},{' '}
                which exceeds the $2,500 threshold for automatic insurance coverage. I acknowledge
                that additional insurance has been applied to this shipment and agree to the{' '}
                <a
                  href={TERMS_LINKS.insurancePolicy}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline inline-flex items-center gap-0.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  insurance terms
                  <ExternalLink className="h-3 w-3" />
                </a>
                .
              </p>
            </div>
            <Shield className="h-5 w-5 text-amber-600 shrink-0" />
          </div>
        )}

        {/* Checkbox 2 (alt): Insurance Understood (if under $2500) */}
        {!needsInsuranceAcknowledgment && (
          <div className="flex gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
            <div className="pt-0.5">
              <Checkbox
                id="insuranceUnderstood"
                checked={accepted.insuranceUnderstood}
                onChange={(checked) => handleCheckboxChange('insuranceUnderstood', checked)}
              />
            </div>
            <div className="flex-1">
              <label
                htmlFor="insuranceUnderstood"
                className="text-sm font-medium text-gray-900 cursor-pointer"
              >
                Insurance Coverage Understanding
              </label>
              <p className="text-sm text-gray-600 mt-1">
                I understand the insurance coverage options for this shipment. I acknowledge
                that declared values under $2,500 are subject to standard carrier liability
                limits unless additional insurance is purchased.
              </p>
            </div>
            <Shield className="h-5 w-5 text-gray-400 shrink-0" />
          </div>
        )}

        {/* Checkbox 3: Contents Compliant */}
        <div className="flex gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
          <div className="pt-0.5">
            <Checkbox
              id="contentsCompliant"
              checked={accepted.contentsCompliant}
              onChange={(checked) => handleCheckboxChange('contentsCompliant', checked)}
            />
          </div>
          <div className="flex-1">
            <label
              htmlFor="contentsCompliant"
              className="text-sm font-medium text-gray-900 cursor-pointer"
            >
              Contents Compliance
            </label>
            <p className="text-sm text-gray-600 mt-1">
              I certify that the contents of this shipment comply with all applicable laws
              and regulations. The shipment does not contain{' '}
              <a
                href={TERMS_LINKS.prohibitedItems}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline inline-flex items-center gap-0.5"
                onClick={(e) => e.stopPropagation()}
              >
                prohibited items
                <ExternalLink className="h-3 w-3" />
              </a>{' '}
              including illegal substances, counterfeit goods, or dangerous materials
              (except as properly declared under hazmat regulations).
            </p>
          </div>
          <FileText className="h-5 w-5 text-gray-400 shrink-0" />
        </div>

        {/* Checkbox 4: Carrier Authorized */}
        <div className="flex gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
          <div className="pt-0.5">
            <Checkbox
              id="carrierAuthorized"
              checked={accepted.carrierAuthorized}
              onChange={(checked) => handleCheckboxChange('carrierAuthorized', checked)}
            />
          </div>
          <div className="flex-1">
            <label
              htmlFor="carrierAuthorized"
              className="text-sm font-medium text-gray-900 cursor-pointer"
            >
              Carrier Authorization
            </label>
            <p className="text-sm text-gray-600 mt-1">
              I authorize the selected carrier and its agents to transport this shipment
              according to the{' '}
              <a
                href={TERMS_LINKS.shippingConditions}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline inline-flex items-center gap-0.5"
                onClick={(e) => e.stopPropagation()}
              >
                shipping conditions
                <ExternalLink className="h-3 w-3" />
              </a>
              . I understand that transit times are estimates and not guaranteed unless
              express service with guaranteed delivery is selected and paid for.
            </p>
          </div>
          <Truck className="h-5 w-5 text-gray-400 shrink-0" />
        </div>

        {/* Checkbox 5: Hazmat Certification (if hazmat selected) */}
        {hasHazmat && (
          <div className="flex gap-3 p-4 bg-red-50 rounded-lg border border-red-100">
            <div className="pt-0.5">
              <Checkbox
                id="hazmatCertification"
                checked={accepted.hazmatCertification || false}
                onChange={(checked) => handleCheckboxChange('hazmatCertification', checked)}
              />
            </div>
            <div className="flex-1">
              <label
                htmlFor="hazmatCertification"
                className="text-sm font-medium text-gray-900 cursor-pointer"
              >
                Hazardous Materials Certification
              </label>
              <p className="text-sm text-gray-600 mt-1">
                I certify that all hazardous materials in this shipment have been properly
                classified, packaged, marked, labeled, and documented in accordance with
                applicable DOT, IATA, and ICAO regulations. I have completed required hazmat
                training and understand my responsibilities under{' '}
                <a
                  href={TERMS_LINKS.hazmatGuidelines}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline inline-flex items-center gap-0.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  hazmat guidelines
                  <ExternalLink className="h-3 w-3" />
                </a>
                . I confirm that emergency contact information is accurate and available.
              </p>
            </div>
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
          </div>
        )}

        {/* Full Terms Link */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            By submitting this shipment, you agree to our{' '}
            <a
              href={TERMS_LINKS.fullTerms}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline inline-flex items-center gap-0.5"
            >
              Terms of Service
              <ExternalLink className="h-3 w-3" />
            </a>{' '}
            and acknowledge that you have read and understood all applicable shipping
            conditions, liability limitations, and carrier policies.
          </p>
        </div>
      </div>
    </div>
  )
}
