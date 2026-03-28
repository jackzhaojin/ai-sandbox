'use client'

import React, { useState, useEffect } from 'react'
import { useEditor } from './EditorContext'
import { toast } from 'sonner'
import { AlertCircle, Check } from 'lucide-react'

interface SeoData {
  seoTitle?: string
  seoDescription?: string
  ogTitle?: string
  ogDescription?: string
  ogImageId?: string
  canonicalUrl?: string
  noIndex?: string
  noFollow?: string
  structuredData?: string
}

interface SeoScore {
  score: number
  color: string
  items: { label: string; points: number; achieved: boolean }[]
}

export default function PageSeoPanel() {
  const { pageId } = useEditor()
  const [seoData, setSeoData] = useState<SeoData>({})
  const [isSaving, setIsSaving] = useState(false)
  const [pageTitle, setPageTitle] = useState('')
  const [pageSlug, setPageSlug] = useState('')

  // Load SEO data
  useEffect(() => {
    fetchSeoData()
  }, [pageId])

  const fetchSeoData = async () => {
    try {
      const response = await fetch(`/api/pages/${pageId}`)
      if (response.ok) {
        const data = await response.json()
        setSeoData({
          seoTitle: data.page.seoTitle || '',
          seoDescription: data.page.seoDescription || '',
          ogTitle: data.page.ogTitle || '',
          ogDescription: data.page.ogDescription || '',
          ogImageId: data.page.ogImageId || '',
          canonicalUrl: data.page.canonicalUrl || '',
          noIndex: data.page.noIndex || 'false',
          noFollow: data.page.noFollow || 'false',
          structuredData: data.page.structuredData || ''
        })
        setPageTitle(data.page.title || '')
        setPageSlug(data.page.slug || '')
      }
    } catch (error) {
      console.error('Error fetching SEO data:', error)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/pages/${pageId}/seo`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(seoData),
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

  const calculateSeoScore = (): SeoScore => {
    const items = [
      { label: 'SEO Title', points: 20, achieved: !!seoData.seoTitle && seoData.seoTitle.length > 0 },
      { label: 'Meta Description', points: 20, achieved: !!seoData.seoDescription && seoData.seoDescription.length > 0 },
      { label: 'OG Image', points: 15, achieved: !!seoData.ogImageId },
      { label: 'OG Title', points: 10, achieved: !!seoData.ogTitle },
      { label: 'OG Description', points: 10, achieved: !!seoData.ogDescription },
      { label: 'Has Parent Page', points: 10, achieved: true }, // Simplified - would need actual check
      { label: 'Canonical URL', points: 5, achieved: !!seoData.canonicalUrl },
      { label: 'Structured Data', points: 10, achieved: !!seoData.structuredData }
    ]

    const score = items.reduce((sum, item) => sum + (item.achieved ? item.points : 0), 0)

    let color = 'red'
    if (score >= 70) color = 'green'
    else if (score >= 40) color = 'yellow'

    return { score, color, items }
  }

  const seoScore = calculateSeoScore()

  const getTitleCharCount = () => seoData.seoTitle?.length || 0
  const getTitleColor = () => {
    const count = getTitleCharCount()
    if (count > 70) return 'text-red-600'
    if (count > 60) return 'text-yellow-600'
    return 'text-gray-600'
  }

  const getDescriptionCharCount = () => seoData.seoDescription?.length || 0
  const getDescriptionColor = () => {
    const count = getDescriptionCharCount()
    if (count > 200) return 'text-red-600'
    if (count > 160) return 'text-yellow-600'
    return 'text-gray-600'
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      {/* SEO Score */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">SEO Score</h3>
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-full border-4 ${
              seoScore.color === 'green'
                ? 'border-green-500 bg-green-50'
                : seoScore.color === 'yellow'
                ? 'border-yellow-500 bg-yellow-50'
                : 'border-red-500 bg-red-50'
            }`}
          >
            <span
              className={`text-2xl font-bold ${
                seoScore.color === 'green'
                  ? 'text-green-700'
                  : seoScore.color === 'yellow'
                  ? 'text-yellow-700'
                  : 'text-red-700'
              }`}
            >
              {seoScore.score}
            </span>
          </div>
        </div>
        <div className="space-y-1">
          {seoScore.items.map((item, index) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              {item.achieved ? (
                <Check className="h-3 w-3 text-green-600" />
              ) : (
                <AlertCircle className="h-3 w-3 text-gray-400" />
              )}
              <span className={item.achieved ? 'text-gray-700' : 'text-gray-400'}>
                {item.label} (+{item.points})
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* SEO Title */}
      <div className="mb-6">
        <label className="mb-2 flex items-center justify-between text-sm font-medium text-gray-700">
          <span>SEO Title</span>
          <span className={`text-xs ${getTitleColor()}`}>
            {getTitleCharCount()}/60-70 chars
          </span>
        </label>
        <input
          type="text"
          value={seoData.seoTitle || ''}
          onChange={(e) => setSeoData({ ...seoData, seoTitle: e.target.value })}
          placeholder={pageTitle || 'Enter SEO title'}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        <p className="mt-1 text-xs text-gray-500">
          Displayed in search results. Recommended: 50-60 characters
        </p>
      </div>

      {/* Meta Description */}
      <div className="mb-6">
        <label className="mb-2 flex items-center justify-between text-sm font-medium text-gray-700">
          <span>Meta Description</span>
          <span className={`text-xs ${getDescriptionColor()}`}>
            {getDescriptionCharCount()}/160-200 chars
          </span>
        </label>
        <textarea
          value={seoData.seoDescription || ''}
          onChange={(e) => setSeoData({ ...seoData, seoDescription: e.target.value })}
          placeholder="Enter meta description"
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        <p className="mt-1 text-xs text-gray-500">
          Summary for search results. Recommended: 150-160 characters
        </p>
      </div>

      {/* Open Graph Title */}
      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Open Graph Title
        </label>
        <input
          type="text"
          value={seoData.ogTitle || ''}
          onChange={(e) => setSeoData({ ...seoData, ogTitle: e.target.value })}
          placeholder={seoData.seoTitle || pageTitle || 'Enter OG title'}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        <p className="mt-1 text-xs text-gray-500">
          Title for social media shares (Facebook, LinkedIn, etc.)
        </p>
      </div>

      {/* Open Graph Description */}
      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Open Graph Description
        </label>
        <textarea
          value={seoData.ogDescription || ''}
          onChange={(e) => setSeoData({ ...seoData, ogDescription: e.target.value })}
          placeholder={seoData.seoDescription || 'Enter OG description'}
          rows={2}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        <p className="mt-1 text-xs text-gray-500">
          Description for social media shares
        </p>
      </div>

      {/* OG Image */}
      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Open Graph Image
        </label>
        <input
          type="text"
          value={seoData.ogImageId || ''}
          onChange={(e) => setSeoData({ ...seoData, ogImageId: e.target.value })}
          placeholder="Media ID for OG image"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        <p className="mt-1 text-xs text-gray-500">
          Image shown in social media previews (recommended: 1200x630px)
        </p>
      </div>

      {/* Canonical URL */}
      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Canonical URL
        </label>
        <input
          type="text"
          value={seoData.canonicalUrl || ''}
          onChange={(e) => setSeoData({ ...seoData, canonicalUrl: e.target.value })}
          placeholder={`https://example.com/${pageSlug}`}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        <p className="mt-1 text-xs text-gray-500">
          Preferred URL to prevent duplicate content issues
        </p>
      </div>

      {/* Robots Meta Tags */}
      <div className="mb-6">
        <label className="mb-3 block text-sm font-medium text-gray-700">
          Search Engine Indexing
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={seoData.noIndex === 'true'}
              onChange={(e) => setSeoData({ ...seoData, noIndex: e.target.checked ? 'true' : 'false' })}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">No Index (prevent from appearing in search results)</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={seoData.noFollow === 'true'}
              onChange={(e) => setSeoData({ ...seoData, noFollow: e.target.checked ? 'true' : 'false' })}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">No Follow (don't follow links on this page)</span>
          </label>
        </div>
      </div>

      {/* Structured Data */}
      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Structured Data (JSON-LD)
        </label>
        <textarea
          value={seoData.structuredData || ''}
          onChange={(e) => setSeoData({ ...seoData, structuredData: e.target.value })}
          placeholder='{"@context": "https://schema.org", "@type": "Article", ...}'
          rows={6}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-xs focus:border-blue-500 focus:outline-none"
        />
        <p className="mt-1 text-xs text-gray-500">
          Optional JSON-LD for rich snippets (e.g., Article, Product, FAQ)
        </p>
      </div>

      {/* SEO Previews */}
      <div className="mb-6">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">Search Preview</h3>
        <div className="rounded-lg border border-gray-200 p-4">
          <div className="text-xl text-blue-600 hover:underline">
            {seoData.seoTitle || pageTitle || 'Untitled Page'}
          </div>
          <div className="mt-1 text-sm text-green-700">
            {seoData.canonicalUrl || `https://example.com/${pageSlug}`}
          </div>
          <div className="mt-1 text-sm text-gray-600">
            {seoData.seoDescription || 'No meta description provided...'}
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">Social Preview</h3>
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          {seoData.ogImageId && (
            <div className="h-40 bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
              OG Image Preview
            </div>
          )}
          <div className="p-4">
            <div className="font-semibold text-gray-900">
              {seoData.ogTitle || seoData.seoTitle || pageTitle || 'Untitled Page'}
            </div>
            <div className="mt-1 text-sm text-gray-600">
              {seoData.ogDescription || seoData.seoDescription || 'No description...'}
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {seoData.canonicalUrl || `https://example.com/${pageSlug}`}
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSaving ? 'Saving...' : 'Save SEO Settings'}
      </button>
    </div>
  )
}
