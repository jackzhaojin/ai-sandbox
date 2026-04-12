'use client'

import React from 'react'
import { Bell, Mail, MessageSquare, Phone, Truck, CheckCircle, Route } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { type NotificationPreferences } from '@/types/pickup'

interface NotificationPreferencesProps {
  value: NotificationPreferences
  onChange: (value: NotificationPreferences) => void
  disabled?: boolean
}

interface NotificationOption {
  key: keyof NotificationPreferences
  label: string
  description: string
  icon: React.ReactNode
  defaultState: boolean
}

const NOTIFICATION_OPTIONS: NotificationOption[] = [
  {
    key: 'emailReminder24h',
    label: 'Email Reminder (24 hours before)',
    description: 'Receive an email reminder the day before your scheduled pickup',
    icon: <Mail className="h-4 w-4" />,
    defaultState: true,
  },
  {
    key: 'smsReminder2h',
    label: 'SMS Reminder (2 hours before)',
    description: 'Get a text message 2 hours before the pickup window begins',
    icon: <MessageSquare className="h-4 w-4" />,
    defaultState: true,
  },
  {
    key: 'callReminder30m',
    label: 'Phone Call Reminder (30 minutes before)',
    description: 'Receive an automated phone call 30 minutes before pickup',
    icon: <Phone className="h-4 w-4" />,
    defaultState: false,
  },
  {
    key: 'driverEnroute',
    label: 'Driver En Route Notification',
    description: 'Get notified when the driver is heading to your location',
    icon: <Truck className="h-4 w-4" />,
    defaultState: true,
  },
  {
    key: 'pickupCompletion',
    label: 'Pickup Completion Confirmation',
    description: 'Receive confirmation with tracking number once pickup is complete',
    icon: <CheckCircle className="h-4 w-4" />,
    defaultState: true,
  },
  {
    key: 'transitUpdates',
    label: 'Transit Status Updates',
    description: 'Get notified of key transit milestones (departed, arrived, out for delivery)',
    icon: <Route className="h-4 w-4" />,
    defaultState: true,
  },
]

export function NotificationPreferencesForm({
  value,
  onChange,
  disabled = false,
}: NotificationPreferencesProps) {
  const handleCheckboxChange = (
    key: keyof NotificationPreferences,
    checked: boolean
  ) => {
    onChange({ ...value, [key]: checked })
  }

  // Get active notification count
  const activeCount = Object.values(value).filter(Boolean).length

  return (
    <div className={cn('space-y-6', disabled && 'opacity-50')}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-blue-600" />
          <h3 className="text-base font-semibold text-gray-900">
            Notification Preferences
          </h3>
        </div>
        <span className="text-sm text-gray-500">
          {activeCount} of {NOTIFICATION_OPTIONS.length} enabled
        </span>
      </div>

      <p className="text-sm text-gray-500">
        Choose how and when you'd like to be notified about your pickup.
        We recommend keeping at least email notifications enabled.
      </p>

      {/* Notification Options */}
      <div className="space-y-3">
        {NOTIFICATION_OPTIONS.map((option) => {
          const isEnabled = value[option.key]
          return (
            <div
              key={option.key}
              className={cn(
                'flex items-start gap-3 p-3 rounded-lg border transition-all',
                isEnabled
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-white border-gray-200'
              )}
            >
              <Checkbox
                id={`notification-${option.key}`}
                checked={isEnabled}
                onChange={(checked) => handleCheckboxChange(option.key, checked)}
                disabled={disabled}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <Label
                  htmlFor={`notification-${option.key}`}
                  className={cn(
                    'flex items-center gap-2 text-sm font-medium cursor-pointer',
                    isEnabled ? 'text-blue-900' : 'text-gray-900'
                  )}
                >
                  <span
                    className={cn(
                      'flex items-center justify-center w-6 h-6 rounded',
                      isEnabled ? 'text-blue-600' : 'text-gray-400'
                    )}
                  >
                    {option.icon}
                  </span>
                  {option.label}
                </Label>
                <p
                  className={cn(
                    'text-sm mt-1 ml-8',
                    isEnabled ? 'text-blue-700' : 'text-gray-500'
                  )}
                >
                  {option.description}
                </p>
              </div>
              {isEnabled && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  ON
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() =>
            onChange({
              emailReminder24h: true,
              smsReminder2h: true,
              callReminder30m: true,
              driverEnroute: true,
              pickupCompletion: true,
              transitUpdates: true,
            })
          }
          disabled={disabled}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 rounded-full hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Enable All
        </button>
        <button
          type="button"
          onClick={() =>
            onChange({
              emailReminder24h: true,
              smsReminder2h: false,
              callReminder30m: false,
              driverEnroute: false,
              pickupCompletion: true,
              transitUpdates: false,
            })
          }
          disabled={disabled}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-full hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Minimal (Essentials Only)
        </button>
        <button
          type="button"
          onClick={() =>
            onChange({
              emailReminder24h: true,
              smsReminder2h: true,
              callReminder30m: false,
              driverEnroute: true,
              pickupCompletion: true,
              transitUpdates: true,
            })
          }
          disabled={disabled}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 rounded-full hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Recommended (Default)
        </button>
      </div>

      {/* Contact Method Note */}
      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
        <p className="text-xs text-gray-500">
          <strong>Note:</strong> Notifications will be sent to your primary contact's
          email and/or phone based on your selections. SMS and call notifications
          require a valid mobile phone number.
        </p>
      </div>
    </div>
  )
}
