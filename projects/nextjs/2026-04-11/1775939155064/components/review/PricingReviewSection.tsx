'use client'

import { ReviewSection, KeyValuePair, SectionGrid, Subsection, SectionDivider } from './ReviewSection'
import type { PricingData } from './types'
import { Truck } from 'lucide-react'

interface PricingReviewSectionProps {
  data: PricingData | null
  shipmentId: string
}

export function PricingReviewSection({ data, shipmentId }: PricingReviewSectionProps) {
  const isComplete = !!data && !!data.carrierName && data.total > 0

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(1)}%`
  }

  return (
    <ReviewSection
      title="Pricing & Rates"
      editHref={`/shipments/${shipmentId}/pricing`}
      isComplete={isComplete}
      incompleteMessage="No shipping rate has been selected. Please complete Step 2."
    >
      {data ? (
        <div className="space-y-6">
          {/* Service Summary */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Truck className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{data.carrierName}</p>
                <p className="text-sm text-gray-600">{data.serviceName}</p>
                <p className="text-xs text-gray-500">
                  {data.transitDaysMin}-{data.transitDaysMax} business days
                </p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(data.total, data.currency)}
                </p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
            </div>
          </div>

          {/* Cost Breakdown */}
          <Subsection title="Cost Breakdown">
            <div className="space-y-3">
              {/* Base Rate */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Base Rate</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(data.baseRate, data.currency)}
                </span>
              </div>

              {/* Fuel Surcharge */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  Fuel Surcharge ({formatPercent(data.fuelSurchargePercent)})
                </span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(data.fuelSurcharge, data.currency)}
                </span>
              </div>

              {/* Insurance */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  Insurance ({formatPercent(data.insuranceRate)})
                </span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(data.insurance, data.currency)}
                </span>
              </div>

              {/* Special Handling Fees */}
              {data.specialHandlingTotal > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Special Handling</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(data.specialHandlingTotal, data.currency)}
                  </span>
                </div>
              )}

              {/* Delivery Confirmation Fees */}
              {data.deliveryConfirmationTotal > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Delivery Confirmation</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(data.deliveryConfirmationTotal, data.currency)}
                  </span>
                </div>
              )}

              {/* Handling Fees */}
              {data.handlingFees && data.handlingFees > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Handling Fees</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(data.handlingFees, data.currency)}
                  </span>
                </div>
              )}

              {/* Delivery Fees */}
              {data.deliveryFees && data.deliveryFees > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Delivery Fees</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(data.deliveryFees, data.currency)}
                  </span>
                </div>
              )}

              {/* Tax */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  Tax ({formatPercent(data.taxRate)})
                </span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(data.tax, data.currency)}
                </span>
              </div>

              {/* Total */}
              <SectionDivider />
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="text-xl font-bold text-gray-900">
                  {formatCurrency(data.total, data.currency)}
                </span>
              </div>
            </div>
          </Subsection>

          {/* Weight & Distance Details */}
          {(data.billableWeight || data.dimWeight || data.distance) && (
            <>
              <SectionDivider />
              <SectionGrid>
                {data.distance && (
                  <KeyValuePair
                    label="Distance"
                    value={`${data.distance} miles`}
                  />
                )}
                {data.billableWeight && (
                  <KeyValuePair
                    label="Billable Weight"
                    value={`${data.billableWeight} lbs`}
                  />
                )}
                {data.dimWeight && (
                  <KeyValuePair
                    label="DIM Weight"
                    value={`${data.dimWeight} lbs`}
                  />
                )}
              </SectionGrid>
            </>
          )}
        </div>
      ) : (
        <p className="text-gray-500 italic">No pricing information available</p>
      )}
    </ReviewSection>
  )
}
