'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, Save } from 'lucide-react'

interface SeoSettings {
  defaultTitleTemplate?: string
  defaultMetaDescription?: string
  defaultOgImageId?: string
  robotsTxt?: string
  siteName?: string
}

interface PageProps {
  params: Promise<{
    siteId: string
  }>
}

export default function SiteSeoSettings({ params }: PageProps) {
  const router = useRouter()
  const [unwrappedParams, setUnwrappedParams] = useState<{
    siteId: string
  } | null>(null)
  const [seoSettings, setSeoSettings] = useState<SeoSettings>({
    defaultTitleTemplate: '{page_title} | {site_name}',
    defaultMetaDescription: '',
    defaultOgImageId: '',
    robotsTxt: `User-agent: *
Allow: /
Disallow: /api/
Disallow: /dashboard/

Sitemap: {site_url}/sitemap.xml`,
    siteName: ''
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Unwrap params
  useEffect(() => {
    params.then(setUnwrappedParams)
  }, [params])

  // Load site SEO settings
  useEffect(() => {
    if (unwrappedParams) {
      fetchSeoSettings()
    }
  }, [unwrappedParams])

  const fetchSeoSettings = async () => {
    if (!unwrappedParams) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/sites/${unwrappedParams.siteId}`)
      if (response.ok) {
        const data = await response.json()
        setSeoSettings({
          defaultTitleTemplate: data.site.seoSettings?.defaultTitleTemplate || '{page_title} | {site_name}',
          defaultMetaDescription: data.site.seoSettings?.defaultMetaDescription || '',
          defaultOgImageId: data.site.seoSettings?.defaultOgImageId || '',
          robotsTxt: data.site.seoSettings?.robotsTxt || `User-agent: *
Allow: /
Disallow: /api/
Disallow: /dashboard/

Sitemap: {site_url}/sitemap.xml`,
          siteName: data.site.name || ''
        })
      }
    } catch (error) {
      console.error('Error fetching SEO settings:', error)
      toast.error('Failed to load SEO settings')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!unwrappedParams) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/sites/${unwrappedParams.siteId}/seo`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(seoSettings),
      })

      if (!response.ok) {
        throw new Error('Failed to save SEO settings')
      }

      toast.success('SEO settings saved successfully')
    } catch (error) {
      console.error('Error saving SEO settings:', error)
      toast.error('Failed to save SEO settings')
    } finally {
      setIsSaving(false)
    }
  }

  if (!unwrappedParams) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>
  }

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading SEO settings...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-6">
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
                <h1 className="text-2xl font-bold text-gray-900">Site SEO Settings</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Configure default SEO settings for your site
                </p>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="space-y-8">
          {/* Title Template */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Title Template</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Default Title Template
                </label>
                <input
                  type="text"
                  value={seoSettings.defaultTitleTemplate}
                  onChange={(e) => setSeoSettings({ ...seoSettings, defaultTitleTemplate: e.target.value })}
                  placeholder="{page_title} | {site_name}"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
                <p className="mt-2 text-xs text-gray-500">
                  Available variables: <code className="rounded bg-gray-100 px-1 py-0.5">{'{page_title}'}</code>,{' '}
                  <code className="rounded bg-gray-100 px-1 py-0.5">{'{site_name}'}</code>
                </p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Site Name
                </label>
                <input
                  type="text"
                  value={seoSettings.siteName}
                  onChange={(e) => setSeoSettings({ ...seoSettings, siteName: e.target.value })}
                  placeholder="My Awesome Site"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
                <p className="mt-2 text-xs text-gray-500">
                  Used in title template and other metadata
                </p>
              </div>
            </div>
          </div>

          {/* Default Meta Description */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Default Meta Description</h2>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Fallback Description
              </label>
              <textarea
                value={seoSettings.defaultMetaDescription}
                onChange={(e) => setSeoSettings({ ...seoSettings, defaultMetaDescription: e.target.value })}
                placeholder="Enter a default meta description for pages without one"
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              <p className="mt-2 text-xs text-gray-500">
                Used when a page doesn't have a custom meta description (150-160 chars recommended)
              </p>
            </div>
          </div>

          {/* Default OG Image */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Default Open Graph Image</h2>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Default OG Image ID
              </label>
              <input
                type="text"
                value={seoSettings.defaultOgImageId}
                onChange={(e) => setSeoSettings({ ...seoSettings, defaultOgImageId: e.target.value })}
                placeholder="Media ID for default OG image"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              <p className="mt-2 text-xs text-gray-500">
                Default image for social media shares when page doesn't specify one (1200x630px recommended)
              </p>
            </div>
          </div>

          {/* Robots.txt */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Robots.txt</h2>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Custom Robots.txt Content
              </label>
              <textarea
                value={seoSettings.robotsTxt}
                onChange={(e) => setSeoSettings({ ...seoSettings, robotsTxt: e.target.value })}
                placeholder="User-agent: *&#10;Allow: /"
                rows={10}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-xs focus:border-blue-500 focus:outline-none"
              />
              <p className="mt-2 text-xs text-gray-500">
                Available variables: <code className="rounded bg-gray-100 px-1 py-0.5">{'{site_url}'}</code>
              </p>
              <p className="mt-1 text-xs text-gray-500">
                This will be served at /robots.txt
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
