'use client'

import { ReviewSection, KeyValuePair, SectionGrid } from './ReviewSection'
import type { OriginData } from './types'
import { LOCATION_TYPE_LABELS } from '@/lib/validation'

interface OriginReviewSectionProps {
  data: OriginData | null
  shipmentId: string
}

export function OriginReviewSection({ data, shipmentId }: OriginReviewSectionProps) {
  const isComplete = !!data && !!data.name && !!data.line1 && !!data.city && !!data.state && !!data.postal

  return (
    <ReviewSection
      title="Origin"
      editHref={`/shipments/new?edit=${shipmentId}`}
      isComplete={isComplete}
      incompleteMessage="Origin address information is incomplete. Please complete Step 1."
    >
      {data ? (
        <SectionGrid>
          <KeyValuePair
            label="Contact Name"
            value={data.name}
          />
          {data.company && (
            <KeyValuePair
              label="Company"
              value={data.company}
            />
          )}
          <KeyValuePair
            label="Address"
            value={
              <div>
                <div>{data.line1}</div>
                {data.line2 && <div>{data.line2}</div>}
                <div>{data.city}, {data.state} {data.postal}</div>
                <div>{data.country}</div>
              </div>
            }
          />
          <KeyValuePair
            label="Location Type"
            value={data.locationType ? LOCATION_TYPE_LABELS[data.locationType as keyof typeof LOCATION_TYPE_LABELS] : undefined}
          />
          <KeyValuePair
            label="Phone"
            value={data.extension ? `${data.phone} ext. ${data.extension}` : data.phone}
          />
          <KeyValuePair
            label="Email"
            value={data.email}
          />
          {data.pickupInstructions && (
            <KeyValuePair
              label="Pickup Instructions"
              value={data.pickupInstructions}
              className="md:col-span-2"
            />
          )}
        </SectionGrid>
      ) : (
        <p className="text-gray-500 italic">No origin information available</p>
      )}
    </ReviewSection>
  )
}
