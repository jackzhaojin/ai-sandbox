'use client'

import { ReviewSection, KeyValuePair, SectionGrid, Subsection, SectionDivider } from './ReviewSection'
import type { PackageData, SpecialHandlingItem, DeliveryPreferenceItem } from './types'

interface PackageReviewSectionProps {
  data: PackageData | null
  specialHandling: SpecialHandlingItem[]
  deliveryPreferences: DeliveryPreferenceItem[]
  shipmentId: string
}

// Package type display mapping
const PACKAGE_TYPE_LABELS: Record<string, string> = {
  envelope: 'Envelope',
  'small-box': 'Small Box',
  'medium-box': 'Medium Box',
  'large-box': 'Large Box',
  'extra-large': 'Extra Large',
  pallet: 'Pallet',
  custom: 'Custom',
}

export function PackageReviewSection({
  data,
  specialHandling,
  deliveryPreferences,
  shipmentId,
}: PackageReviewSectionProps) {
  const isComplete = !!data && !!data.type && data.weight > 0 && data.declaredValue > 0

  // Calculate DIM weight
  const calculateDIMWeight = () => {
    if (!data) return 0
    // DIM weight = (L × W × H) / DIM divisor (139 for domestic US)
    const dimWeight = (data.length * data.width * data.height) / 139
    return Math.round(dimWeight * 10) / 10
  }

  const dimWeight = calculateDIMWeight()
  const billableWeight = data ? Math.max(data.weight, dimWeight) : 0

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }

  return (
    <ReviewSection
      title="Package Details"
      editHref={`/shipments/new?edit=${shipmentId}`}
      isComplete={isComplete}
      incompleteMessage="Package configuration is incomplete. Please complete Step 1."
    >
      {data ? (
        <div className="space-y-6">
          <SectionGrid>
            <KeyValuePair
              label="Package Type"
              value={PACKAGE_TYPE_LABELS[data.type] || data.type}
            />
            <KeyValuePair
              label="Dimensions"
              value={`${data.length} × ${data.width} × ${data.height} ${data.dimensionUnit}`}
            />
            <KeyValuePair
              label="Actual Weight"
              value={`${data.weight} ${data.weightUnit}`}
            />
            <KeyValuePair
              label="DIM Weight"
              value={`${dimWeight} ${data.weightUnit}`}
            />
            <KeyValuePair
              label="Billable Weight"
              value={`${billableWeight} ${data.weightUnit}`}
            />
            <KeyValuePair
              label="Declared Value"
              value={formatCurrency(data.declaredValue, data.currency)}
            />
          </SectionGrid>

          <SectionDivider />

          <KeyValuePair
            label="Contents Description"
            value={data.contentsDescription}
            className="md:col-span-2"
          />

          {/* Special Handling */}
          {specialHandling.length > 0 && (
            <>
              <SectionDivider />
              <Subsection title="Special Handling">
                <ul className="space-y-2">
                  {specialHandling.map((item) => (
                    <li key={item.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{item.name}</span>
                      <span className="font-medium text-gray-900">
                        +{formatCurrency(item.fee, data.currency)}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Special Handling Subtotal</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(specialHandling.reduce((sum, item) => sum + item.fee, 0), data.currency)}
                  </span>
                </div>
              </Subsection>
            </>
          )}

          {/* Delivery Preferences */}
          {deliveryPreferences.length > 0 && (
            <>
              <SectionDivider />
              <Subsection title="Delivery Preferences">
                <ul className="space-y-2">
                  {deliveryPreferences.map((item) => (
                    <li key={item.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{item.name}</span>
                      <span className="font-medium text-gray-900">
                        +{formatCurrency(item.fee, data.currency)}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Delivery Preferences Subtotal</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(deliveryPreferences.reduce((sum, item) => sum + item.fee, 0), data.currency)}
                  </span>
                </div>
              </Subsection>
            </>
          )}
        </div>
      ) : (
        <p className="text-gray-500 italic">No package information available</p>
      )}
    </ReviewSection>
  )
}
