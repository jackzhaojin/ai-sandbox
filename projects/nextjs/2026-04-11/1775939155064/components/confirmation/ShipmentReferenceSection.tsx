'use client'

import { Package, Truck, CreditCard, FileText } from 'lucide-react'
import { ConfirmationSection, KeyValuePair, SectionGrid } from './ConfirmationSection'
import type { ShipmentReferenceData } from './types'

interface ShipmentReferenceSectionProps {
  data: ShipmentReferenceData
}

export function ShipmentReferenceSection({ data }: ShipmentReferenceSectionProps) {
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }

  return (
    <ConfirmationSection
      title="Shipment Reference"
      icon={<FileText className="w-4 h-4 text-blue-600" />}
      defaultExpanded={true}
    >
      <SectionGrid columns={2}>
        <KeyValuePair
          label="Confirmation Number"
          value={
            <span className="font-mono text-lg font-semibold text-gray-900">
              {data.confirmationNumber}
            </span>
          }
        />
        <KeyValuePair
          label="Customer Reference"
          value={data.customerReference || '—'}
        />
        <KeyValuePair
          label="Carrier"
          value={
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-gray-400" />
              <span>{data.carrier?.name || 'Not assigned'}</span>
            </div>
          }
        />
        <KeyValuePair
          label="Service Type"
          value={
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-gray-400" />
              <span>{data.serviceType?.name || 'Standard'}</span>
            </div>
          }
        />
        <KeyValuePair
          label="Transit Time"
          value={
            data.serviceType
              ? `${data.serviceType.transitDaysMin}-${data.serviceType.transitDaysMax} business days`
              : '—'
          }
        />
        <KeyValuePair
          label="Total Cost"
          value={
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-gray-400" />
              <span className="font-semibold text-lg">
                {formatCurrency(data.totalCost, data.currency)}
              </span>
            </div>
          }
        />
      </SectionGrid>
    </ConfirmationSection>
  )
}
