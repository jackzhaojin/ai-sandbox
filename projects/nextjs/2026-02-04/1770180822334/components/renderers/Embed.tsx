'use client'

import React from 'react'
import { AlertTriangle } from 'lucide-react'

export type EmbedMode = 'url' | 'html' | 'preset'
export type EmbedPreset = 'google-maps' | 'twitter' | 'instagram' | 'codepen' | 'figma'

export interface EmbedProps {
  mode: EmbedMode
  url?: string // For url and preset modes
  html?: string // For html mode
  preset?: EmbedPreset // For preset mode
  aspectRatio?: '16/9' | '4/3' | '1/1' | '21/9'
  title?: string
  allowFullscreen?: boolean
  isAdmin?: boolean // Whether current user is admin (for security warnings)
}

export default function Embed({
  mode,
  url,
  html,
  preset,
  aspectRatio = '16/9',
  title = 'Embedded content',
  allowFullscreen = true,
  isAdmin = false
}: EmbedProps) {
  const getAspectRatioClass = () => {
    const ratioMap = {
      '16/9': 'aspect-video',
      '4/3': 'aspect-[4/3]',
      '1/1': 'aspect-square',
      '21/9': 'aspect-[21/9]'
    }
    return ratioMap[aspectRatio]
  }

  const getPresetEmbedUrl = (preset: EmbedPreset, url?: string): string | null => {
    if (!url) return null

    switch (preset) {
      case 'google-maps':
        // Extract place or coordinates from URL and create embed URL
        // Example: https://maps.google.com/maps?q=... -> https://maps.google.com/maps?q=...&output=embed
        if (url.includes('google.com/maps')) {
          const urlObj = new URL(url)
          // If it's already an embed URL, return as-is
          if (url.includes('/embed')) return url

          // Convert to embed URL
          const query = urlObj.searchParams.get('q') || urlObj.searchParams.get('pb')
          if (query) {
            return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&output=embed`
          }
          return `${url}&output=embed`
        }
        return url

      case 'twitter':
        // Twitter/X embed - extract tweet ID
        // Example: https://twitter.com/user/status/123456 -> https://platform.twitter.com/embed/Tweet.html?id=123456
        const tweetMatch = url.match(/status\/(\d+)/)
        if (tweetMatch) {
          return `https://platform.twitter.com/embed/Tweet.html?id=${tweetMatch[1]}`
        }
        return url

      case 'instagram':
        // Instagram embed
        // Example: https://www.instagram.com/p/ABC123/ -> https://www.instagram.com/p/ABC123/embed
        if (url.includes('instagram.com/p/')) {
          return url.endsWith('/embed') ? url : `${url.replace(/\/$/, '')}/embed`
        }
        return url

      case 'codepen':
        // CodePen embed
        // Example: https://codepen.io/user/pen/ABC123 -> https://codepen.io/user/embed/ABC123
        const codepenMatch = url.match(/codepen\.io\/([^/]+)\/pen\/([^/?]+)/)
        if (codepenMatch) {
          return `https://codepen.io/${codepenMatch[1]}/embed/${codepenMatch[2]}?default-tab=result`
        }
        return url

      case 'figma':
        // Figma embed
        // Example: https://www.figma.com/file/ABC123/... -> https://www.figma.com/embed?embed_host=share&url=...
        if (url.includes('figma.com/file/')) {
          return `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(url)}`
        }
        return url

      default:
        return url
    }
  }

  const renderEmbed = () => {
    // URL mode - simple iframe embed
    if (mode === 'url' && url) {
      return (
        <iframe
          src={url}
          title={title}
          className="w-full h-full"
          allowFullScreen={allowFullscreen}
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          loading="lazy"
        />
      )
    }

    // HTML mode - embed custom HTML (admin only with warning)
    if (mode === 'html' && html) {
      if (!isAdmin) {
        return (
          <div className="flex items-center justify-center h-full bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
              <p className="text-yellow-800 font-medium">
                HTML embeds are only visible to administrators
              </p>
            </div>
          </div>
        )
      }

      return (
        <div className="relative w-full h-full">
          {/* Security warning for admin */}
          <div className="absolute top-0 left-0 right-0 bg-yellow-100 border-b border-yellow-400 px-4 py-2 text-sm text-yellow-800 flex items-center space-x-2 z-10">
            <AlertTriangle className="w-4 h-4" />
            <span className="font-medium">Admin Only: Custom HTML Embed</span>
          </div>

          <iframe
            srcDoc={html}
            title={title}
            className="w-full h-full pt-10"
            sandbox="allow-scripts"
            loading="lazy"
          />
        </div>
      )
    }

    // Preset mode - predefined integrations
    if (mode === 'preset' && preset && url) {
      const embedUrl = getPresetEmbedUrl(preset, url)

      if (!embedUrl) {
        return (
          <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
            <p className="text-gray-600">Invalid embed URL</p>
          </div>
        )
      }

      // Special handling for certain presets
      const sandboxAttrs: { [key: string]: string } = {
        'google-maps': 'allow-scripts allow-same-origin',
        'twitter': 'allow-scripts allow-same-origin allow-popups',
        'instagram': 'allow-scripts allow-same-origin allow-popups',
        'codepen': 'allow-scripts allow-same-origin allow-forms allow-popups',
        'figma': 'allow-scripts allow-same-origin allow-popups'
      }

      return (
        <iframe
          src={embedUrl}
          title={title}
          className="w-full h-full"
          allowFullScreen={allowFullscreen}
          sandbox={sandboxAttrs[preset] || 'allow-scripts allow-same-origin'}
          loading="lazy"
        />
      )
    }

    // Error state
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">Embed configuration error</p>
          <p className="text-gray-500 text-sm mt-1">
            {mode === 'url' && 'Missing URL'}
            {mode === 'html' && 'Missing HTML content'}
            {mode === 'preset' && 'Missing preset or URL'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${getAspectRatioClass()} w-full bg-gray-50 rounded-lg overflow-hidden`}>
      {renderEmbed()}
    </div>
  )
}
