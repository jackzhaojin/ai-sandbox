'use client'

import { Calendar, Clock, MapPin, Info, CheckCircle } from 'lucide-react'
import { ConfirmationSection, KeyValuePair, SectionGrid, StatusBadge } from './ConfirmationSection'
import type { PickupConfirmationData } from './types'

interface PickupConfirmationSectionProps {
  data: PickupConfirmationData
}

export function PickupConfirmationSection({ data }: PickupConfirmationSectionProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <ConfirmationSection
      title="Pickup Confirmation"
      icon={<Calendar className="w-4 h-4 text-blue-600" />}
      defaultExpanded={true}
    >
      <SectionGrid columns={2}>
        <KeyValuePair
          label="Scheduled Date"
          value={
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>{formatDate(data.scheduledDate)}</span>
            </div>
          }
        />
        <KeyValuePair
          label="Time Window"
          value={
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span>{data.timeWindow}</span>
            </div>
          }
        />
        {data.readyTime && (
          <KeyValuePair
            label="Package Ready By"
            value={
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>{data.readyTime}</span>
              </div>
            }
          />
        )}
        <KeyValuePair
          label="Status"
          value={<StatusBadge status={data.status} />}
        />
      </SectionGrid>

      {/* What to Expect */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-500" />
          What to Expect
        </h4>
        <ul className="space-y-2">
          {data.whatToExpect.map((item, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </ConfirmationSection>
  )
}
