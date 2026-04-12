'use client'

import { MapPin, User, Phone, Mail, FileText, Calendar } from 'lucide-react'
import { ConfirmationSection, KeyValuePair, SectionGrid, SectionDivider } from './ConfirmationSection'
import type { DeliveryInformationData } from './types'

interface DeliveryInformationSectionProps {
  data: DeliveryInformationData
}

export function DeliveryInformationSection({ data }: DeliveryInformationSectionProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Calculating...'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatAddress = (address: DeliveryInformationData['address']) => {
    const parts = [
      address.line1,
      address.line2,
      `${address.city}, ${address.state} ${address.postal}`,
      address.country,
    ].filter(Boolean)
    return parts.join(', ')
  }

  return (
    <ConfirmationSection
      title="Delivery Information"
      icon={<MapPin className="w-4 h-4 text-blue-600" />}
      defaultExpanded={true}
    >
      <SectionGrid columns={2}>
        <KeyValuePair
          label="Estimated Delivery"
          value={
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className={!data.estimatedDate ? 'text-amber-600' : ''}>
                {formatDate(data.estimatedDate)}
              </span>
            </div>
          }
        />
      </SectionGrid>

      <SectionDivider />

      <SectionGrid columns={1}>
        <KeyValuePair
          label="Delivery Address"
          value={
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="font-medium">{data.address.name}</span>
              </div>
              {data.address.company && (
                <p className="text-gray-600 ml-6">{data.address.company}</p>
              )}
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                <span>{formatAddress(data.address)}</span>
              </div>
            </div>
          }
        />
      </SectionGrid>

      <SectionDivider />

      <SectionGrid columns={2}>
        <KeyValuePair
          label="Contact Name"
          value={
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              <span>{data.contact.name}</span>
            </div>
          }
        />
        <KeyValuePair
          label="Contact Phone"
          value={
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-400" />
              <span>{data.contact.phone}</span>
            </div>
          }
        />
        {data.contact.email && (
          <KeyValuePair
            label="Contact Email"
            value={
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <span>{data.contact.email}</span>
              </div>
            }
          />
        )}
      </SectionGrid>

      {data.specialInstructions && (
        <>
          <SectionDivider />
          <KeyValuePair
            label="Special Instructions"
            value={
              <div className="flex items-start gap-2">
                <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                <span className="text-gray-700">{data.specialInstructions}</span>
              </div>
            }
          />
        </>
      )}
    </ConfirmationSection>
  )
}
