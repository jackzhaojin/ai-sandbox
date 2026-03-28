'use client'

import { useState } from 'react'
import { MediaPicker } from '@/components/media/media-picker'
import Image from 'next/image'

interface GeneralTabProps {
  siteId: string
  name: string
  slug: string
  description: string
  faviconMediaId: string
  logoMediaId: string
  defaultLanguage: string
  timezone: string
  onChange: (field: string, value: any) => void
}

const TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
  { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
  { value: 'America/Denver', label: 'Mountain Time (US & Canada)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Paris', label: 'Paris' },
  { value: 'Europe/Berlin', label: 'Berlin' },
  { value: 'Asia/Tokyo', label: 'Tokyo' },
  { value: 'Asia/Shanghai', label: 'Shanghai' },
  { value: 'Australia/Sydney', label: 'Sydney' },
]

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ja', label: 'Japanese' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ko', label: 'Korean' },
]

export function GeneralTab({
  siteId,
  name,
  slug,
  description,
  faviconMediaId,
  logoMediaId,
  defaultLanguage,
  timezone,
  onChange,
}: GeneralTabProps) {
  const [showFaviconPicker, setShowFaviconPicker] = useState(false)
  const [showLogoPicker, setShowLogoPicker] = useState(false)
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      {/* Site Name */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Site Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => onChange('name', e.target.value)}
          placeholder="My Awesome Site"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        <p className="mt-1 text-xs text-gray-500">
          The name of your site used in titles and metadata
        </p>
      </div>

      {/* Site Slug (readonly) */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Site Slug
        </label>
        <input
          type="text"
          value={slug}
          readOnly
          disabled
          className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
        />
        <p className="mt-1 text-xs text-gray-500">
          The unique identifier for your site (cannot be changed)
        </p>
      </div>

      {/* Description */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => onChange('description', e.target.value)}
          placeholder="A brief description of your site"
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        <p className="mt-1 text-xs text-gray-500">
          Optional description for internal reference
        </p>
      </div>

      {/* Favicon */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Favicon (32x32)
        </label>
        <div className="flex items-center gap-4">
          {faviconUrl && (
            <div className="relative h-12 w-12 overflow-hidden rounded border border-gray-200">
              <Image
                src={faviconUrl}
                alt="Favicon"
                fill
                className="object-cover"
                sizes="48px"
              />
            </div>
          )}
          <button
            type="button"
            onClick={() => setShowFaviconPicker(true)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {faviconMediaId ? 'Change Favicon' : 'Select Favicon'}
          </button>
          {faviconMediaId && (
            <button
              type="button"
              onClick={() => {
                onChange('faviconMediaId', '')
                setFaviconUrl(null)
              }}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Remove
            </button>
          )}
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Recommended size: 32x32 pixels (PNG or ICO format)
        </p>
      </div>

      {/* Logo */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Logo
        </label>
        <div className="flex items-center gap-4">
          {logoUrl && (
            <div className="relative h-16 w-32 overflow-hidden rounded border border-gray-200">
              <Image
                src={logoUrl}
                alt="Logo"
                fill
                className="object-contain p-2"
                sizes="128px"
              />
            </div>
          )}
          <button
            type="button"
            onClick={() => setShowLogoPicker(true)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {logoMediaId ? 'Change Logo' : 'Select Logo'}
          </button>
          {logoMediaId && (
            <button
              type="button"
              onClick={() => {
                onChange('logoMediaId', '')
                setLogoUrl(null)
              }}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Remove
            </button>
          )}
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Your site logo (PNG or SVG format recommended)
        </p>
      </div>

      {/* Default Language */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Default Language
        </label>
        <select
          value={defaultLanguage}
          onChange={(e) => onChange('defaultLanguage', e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500">
          Default language for your site content
        </p>
      </div>

      {/* Timezone */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Timezone
        </label>
        <select
          value={timezone}
          onChange={(e) => onChange('timezone', e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        >
          {TIMEZONES.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500">
          Timezone for scheduled publishing and timestamps
        </p>
      </div>

      {/* Media Pickers */}
      {showFaviconPicker && (
        <MediaPicker
          isOpen={showFaviconPicker}
          onClose={() => setShowFaviconPicker(false)}
          onSelect={(media) => {
            onChange('faviconMediaId', media.id)
            setFaviconUrl(media.url)
            setShowFaviconPicker(false)
          }}
          siteId={siteId}
          allowedTypes={['image/']}
        />
      )}

      {showLogoPicker && (
        <MediaPicker
          isOpen={showLogoPicker}
          onClose={() => setShowLogoPicker(false)}
          onSelect={(media) => {
            onChange('logoMediaId', media.id)
            setLogoUrl(media.url)
            setShowLogoPicker(false)
          }}
          siteId={siteId}
          allowedTypes={['image/']}
        />
      )}
    </div>
  )
}
