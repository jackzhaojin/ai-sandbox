'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, Save, Settings as SettingsIcon, Palette, BarChart3, Code, Share2, AlertCircle, Trash2 } from 'lucide-react'
import { GeneralTab } from '@/components/settings/general-tab'
import { BrandingTab } from '@/components/settings/branding-tab'
import { AnalyticsTab } from '@/components/settings/analytics-tab'
import { CustomCodeTab } from '@/components/settings/custom-code-tab'
import { SocialLinksTab } from '@/components/settings/social-links-tab'
import { ErrorPagesTab } from '@/components/settings/error-pages-tab'
import { DangerZoneTab } from '@/components/settings/danger-zone-tab'

interface PageProps {
  params: Promise<{
    siteId: string
  }>
}

type TabId = 'general' | 'branding' | 'analytics' | 'custom-code' | 'social' | 'error-pages' | 'danger-zone'

const TABS = [
  { id: 'general' as TabId, label: 'General', icon: SettingsIcon },
  { id: 'branding' as TabId, label: 'Branding & Theme', icon: Palette },
  { id: 'analytics' as TabId, label: 'Analytics', icon: BarChart3 },
  { id: 'custom-code' as TabId, label: 'Custom Code', icon: Code },
  { id: 'social' as TabId, label: 'Social Links', icon: Share2 },
  { id: 'error-pages' as TabId, label: 'Error Pages', icon: AlertCircle },
  { id: 'danger-zone' as TabId, label: 'Danger Zone', icon: Trash2 },
]

export default function SiteSettingsPage({ params }: PageProps) {
  const router = useRouter()
  const [unwrappedParams, setUnwrappedParams] = useState<{
    siteId: string
  } | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('general')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Settings state
  const [settings, setSettings] = useState({
    name: '',
    slug: '',
    description: '',
    faviconMediaId: '',
    logoMediaId: '',
    themeConfig: {},
    customHeadHtml: '',
    customCss: '',
    analyticsConfig: {},
    socialLinks: {},
    errorPages: {},
    settings: {
      defaultLanguage: 'en',
      timezone: 'UTC',
    },
  })

  // Unwrap params
  useEffect(() => {
    params.then(setUnwrappedParams)
  }, [params])

  // Load site settings
  useEffect(() => {
    if (unwrappedParams) {
      fetchSettings()
    }
  }, [unwrappedParams])

  const fetchSettings = async () => {
    if (!unwrappedParams) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/sites/${unwrappedParams.siteId}`)
      if (response.ok) {
        const data = await response.json()
        setSettings({
          name: data.site.name || '',
          slug: data.site.slug || '',
          description: data.site.description || '',
          faviconMediaId: data.site.faviconMediaId || '',
          logoMediaId: data.site.logoMediaId || '',
          themeConfig: data.site.themeConfig || {},
          customHeadHtml: data.site.customHeadHtml || '',
          customCss: data.site.customCss || '',
          analyticsConfig: data.site.analyticsConfig || {},
          socialLinks: data.site.socialLinks || {},
          errorPages: data.site.errorPages || {},
          settings: data.site.settings || {
            defaultLanguage: 'en',
            timezone: 'UTC',
          },
        })
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast.error('Failed to load settings')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFieldChange = (field: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleGeneralFieldChange = (field: string, value: any) => {
    if (field === 'defaultLanguage' || field === 'timezone') {
      setSettings((prev) => ({
        ...prev,
        settings: {
          ...prev.settings,
          [field]: value,
        },
      }))
    } else {
      handleFieldChange(field, value)
    }
  }

  const handleSave = async () => {
    if (!unwrappedParams) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/sites/${unwrappedParams.siteId}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })

      if (!response.ok) {
        throw new Error('Failed to save settings')
      }

      toast.success('Settings saved successfully')
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  if (!unwrappedParams) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>
  }

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading settings...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push(`/dashboard/${unwrappedParams.siteId}`)}
                className="rounded-lg p-2 hover:bg-gray-100"
                type="button"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Site Settings</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Configure your site's settings and preferences
                </p>
              </div>
            </div>
            {activeTab !== 'danger-zone' && (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                type="button"
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save Settings'}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex gap-1 overflow-x-auto">
            {TABS.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              const isDanger = tab.id === 'danger-zone'

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors
                    ${isActive
                      ? isDanger
                        ? 'border-b-2 border-red-600 text-red-600'
                        : 'border-b-2 border-blue-600 text-blue-600'
                      : isDanger
                        ? 'text-red-600 hover:text-red-700'
                        : 'text-gray-600 hover:text-gray-900'
                    }
                  `}
                  type="button"
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          {activeTab === 'general' && (
            <GeneralTab
              siteId={unwrappedParams.siteId}
              name={settings.name}
              slug={settings.slug}
              description={settings.description}
              faviconMediaId={settings.faviconMediaId}
              logoMediaId={settings.logoMediaId}
              defaultLanguage={settings.settings.defaultLanguage}
              timezone={settings.settings.timezone}
              onChange={handleGeneralFieldChange}
            />
          )}

          {activeTab === 'branding' && (
            <BrandingTab
              themeConfig={settings.themeConfig}
              onChange={handleFieldChange}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsTab
              analyticsConfig={settings.analyticsConfig}
              onChange={handleFieldChange}
            />
          )}

          {activeTab === 'custom-code' && (
            <CustomCodeTab
              customHeadHtml={settings.customHeadHtml}
              customCss={settings.customCss}
              onChange={handleFieldChange}
            />
          )}

          {activeTab === 'social' && (
            <SocialLinksTab
              socialLinks={settings.socialLinks}
              onChange={handleFieldChange}
            />
          )}

          {activeTab === 'error-pages' && (
            <ErrorPagesTab
              errorPages={settings.errorPages}
              onChange={handleFieldChange}
            />
          )}

          {activeTab === 'danger-zone' && (
            <DangerZoneTab
              siteId={unwrappedParams.siteId}
              siteName={settings.name}
            />
          )}
        </div>
      </main>
    </div>
  )
}
