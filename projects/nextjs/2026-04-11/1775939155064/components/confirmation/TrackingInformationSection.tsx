'use client'

import { useState } from 'react'
import { Package, ExternalLink, Clock, Bell, BellOff, CheckCircle, AlertCircle, Copy, CheckCheck } from 'lucide-react'
import { ConfirmationSection, KeyValuePair, SectionGrid } from './ConfirmationSection'
import type { TrackingInformationData } from './types'
import { cn } from '@/lib/utils'

interface TrackingInformationSectionProps {
  data: TrackingInformationData
}

export function TrackingInformationSection({ data }: TrackingInformationSectionProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!data.trackingNumber) return
    try {
      await navigator.clipboard.writeText(data.trackingNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      console.error('Failed to copy to clipboard')
    }
  }

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '—'
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const isTrackingAvailable = data.trackingNumber && 
    data.trackingAvailableAt && 
    new Date(data.trackingAvailableAt) <= new Date()

  return (
    <ConfirmationSection
      title="Tracking Information"
      icon={<Package className="w-4 h-4 text-blue-600" />}
      defaultExpanded={true}
    >
      {/* Tracking Number Status */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        {isTrackingAvailable ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Tracking Active</p>
              <p className="text-sm text-gray-600">
                Your shipment is now trackable
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Tracking Pending</p>
              <p className="text-sm text-gray-600">
                Tracking number will be available around{' '}
                <span className="font-medium">{formatTime(data.trackingAvailableAt)}</span>
              </p>
            </div>
          </div>
        )}
      </div>

      <SectionGrid columns={1}>
        <KeyValuePair
          label="Tracking Number"
          value={
            <div className="flex items-center gap-3">
              {data.trackingNumber ? (
                <>
                  <span className="font-mono text-lg font-semibold text-gray-900">
                    {data.trackingNumber}
                  </span>
                  <button
                    onClick={handleCopy}
                    className={cn(
                      'inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors',
                      copied
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    {copied ? (
                      <>
                        <CheckCheck className="w-3 h-3" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copy
                      </>
                    )}
                  </button>
                </>
              ) : (
                <span className="text-gray-500 italic">Not yet assigned</span>
              )}
            </div>
          }
        />
      </SectionGrid>

      {/* Carrier Tracking Link */}
      {data.carrierTrackingUrl && (
        <div className="mt-4">
          <a
            href={data.carrierTrackingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
          >
            <ExternalLink className="w-4 h-4" />
            Track on Carrier Website
          </a>
        </div>
      )}

      {/* Notification Preferences */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
          Update Preferences
        </h4>
        <div className="flex flex-wrap gap-3">
          <div
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm',
              data.smsNotifications
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-gray-50 border-gray-200 text-gray-600'
            )}
          >
            {data.smsNotifications ? (
              <Bell className="w-4 h-4" />
            ) : (
              <BellOff className="w-4 h-4" />
            )}
            <span>SMS Updates</span>
          </div>
          <div
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm',
              data.emailNotifications
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-gray-50 border-gray-200 text-gray-600'
            )}
          >
            {data.emailNotifications ? (
              <Bell className="w-4 h-4" />
            ) : (
              <BellOff className="w-4 h-4" />
            )}
            <span>Email Updates</span>
          </div>
        </div>
      </div>
    </ConfirmationSection>
  )
}
