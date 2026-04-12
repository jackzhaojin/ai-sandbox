'use client'

import { Shield, MapPin, Package, Plus, Repeat, Truck, Sparkles } from 'lucide-react'
import { ConfirmationSection } from './ConfirmationSection'
import { cn } from '@/lib/utils'

interface AdditionalServicesSectionProps {
  shipmentId: string
  className?: string
}

const services = [
  {
    id: 'add-insurance',
    label: 'Add Insurance',
    description: 'Increase coverage for valuable items',
    icon: Shield,
    color: 'amber',
  },
  {
    id: 'change-address',
    label: 'Change Address',
    description: 'Update delivery address before transit',
    icon: MapPin,
    color: 'blue',
  },
  {
    id: 'hold-location',
    label: 'Hold at Location',
    description: 'Pick up at a carrier facility',
    icon: Package,
    color: 'purple',
  },
  {
    id: 'schedule-another',
    label: 'Schedule Another',
    description: 'Create a new shipment',
    icon: Plus,
    color: 'green',
  },
  {
    id: 'repeat-shipment',
    label: 'Repeat This Shipment',
    description: 'Duplicate this shipment details',
    icon: Repeat,
    color: 'cyan',
  },
]

const colorClasses: Record<string, { bg: string; text: string; border: string; hover: string }> = {
  amber: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    hover: 'hover:bg-amber-100',
  },
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    hover: 'hover:bg-blue-100',
  },
  purple: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    hover: 'hover:bg-purple-100',
  },
  green: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
    hover: 'hover:bg-green-100',
  },
  cyan: {
    bg: 'bg-cyan-50',
    text: 'text-cyan-700',
    border: 'border-cyan-200',
    hover: 'hover:bg-cyan-100',
  },
}

export function AdditionalServicesSection({
  shipmentId,
  className,
}: AdditionalServicesSectionProps) {
  const handleServiceClick = (serviceId: string) => {
    // Stub for v1 - just show alert
    const messages: Record<string, string> = {
      'add-insurance': 'Add Insurance - Stub for v1',
      'change-address': 'Change Address - Stub for v1',
      'hold-location': 'Hold at Location - Stub for v1',
      'schedule-another': 'Navigating to new shipment...',
      'repeat-shipment': 'Repeat This Shipment - Stub for v1',
    }

    if (serviceId === 'schedule-another') {
      window.location.href = '/shipments/new'
    } else {
      alert(messages[serviceId] || 'Coming soon')
    }
  }

  return (
    <ConfirmationSection
      title="Additional Services"
      icon={<Sparkles className="w-4 h-4 text-blue-600" />}
      defaultExpanded={false}
      className={className}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {services.map((service) => {
          const Icon = service.icon
          const colors = colorClasses[service.color]

          return (
            <button
              key={service.id}
              onClick={() => handleServiceClick(service.id)}
              className={cn(
                'flex items-start gap-3 p-4 rounded-lg border text-left transition-all duration-200',
                'hover:shadow-md hover:-translate-y-0.5',
                colors.bg,
                colors.border,
                colors.hover
              )}
            >
              <div
                className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                  'bg-white/50'
                )}
              >
                <Icon className={cn('w-5 h-5', colors.text)} />
              </div>
              <div>
                <h4 className={cn('font-semibold text-sm', colors.text)}>
                  {service.label}
                </h4>
                <p className="text-xs text-gray-600 mt-0.5">
                  {service.description}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </ConfirmationSection>
  )
}
