'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import PropertyLabel from './PropertyLabel'
import MediaPicker from './MediaPicker'
import type { VideoProps, VideoSource } from '@/components/renderers/Video'

interface VideoEditorProps {
  props: VideoProps
  onChange: (props: Partial<VideoProps>) => void
}

export default function VideoEditor({ props, onChange }: VideoEditorProps) {
  // Auto-detect video source and ID from URL
  const handleUrlChange = (url: string) => {
    if (!url) {
      onChange({ url, videoId: undefined, source: 'url' })
      return
    }

    // YouTube detection
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    const youtubeMatch = url.match(youtubeRegex)
    if (youtubeMatch) {
      onChange({
        source: 'youtube',
        videoId: youtubeMatch[1],
        url: undefined
      })
      return
    }

    // Vimeo detection
    const vimeoRegex = /(?:vimeo\.com\/)(\d+)/
    const vimeoMatch = url.match(vimeoRegex)
    if (vimeoMatch) {
      onChange({
        source: 'vimeo',
        videoId: vimeoMatch[1],
        url: undefined
      })
      return
    }

    // Default to URL if no match
    onChange({ source: 'url', url, videoId: undefined })
  }

  const getDisplayUrl = () => {
    if (props.source === 'youtube' && props.videoId) {
      return `https://www.youtube.com/watch?v=${props.videoId}`
    }
    if (props.source === 'vimeo' && props.videoId) {
      return `https://vimeo.com/${props.videoId}`
    }
    return props.url || ''
  }

  return (
    <div className="space-y-4">
      {/* Source Type */}
      <div>
        <PropertyLabel>Video Source</PropertyLabel>
        <div className="flex gap-2">
          {(['youtube', 'vimeo', 'url'] as VideoSource[]).map((source) => (
            <button
              key={source}
              onClick={() => onChange({ source, videoId: undefined, url: undefined })}
              className={`flex-1 px-4 py-2 rounded-lg border-2 transition capitalize ${
                props.source === source
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              {source === 'url' ? 'Self-Hosted' : source}
            </button>
          ))}
        </div>
      </div>

      {/* URL/Video ID Input */}
      <div>
        <PropertyLabel htmlFor="videoUrl">
          {props.source === 'youtube' && 'YouTube URL or Video ID'}
          {props.source === 'vimeo' && 'Vimeo URL or Video ID'}
          {props.source === 'url' && 'Video URL'}
        </PropertyLabel>
        <Input
          id="videoUrl"
          value={getDisplayUrl()}
          onChange={(e) => handleUrlChange(e.target.value)}
          placeholder={
            props.source === 'youtube'
              ? 'https://www.youtube.com/watch?v=...'
              : props.source === 'vimeo'
              ? 'https://vimeo.com/...'
              : 'https://example.com/video.mp4'
          }
        />
        {props.videoId && (
          <p className="mt-1 text-xs text-green-600">
            ✓ Video ID detected: {props.videoId}
          </p>
        )}
      </div>

      {/* Title */}
      <div>
        <PropertyLabel htmlFor="title">Title</PropertyLabel>
        <Input
          id="title"
          value={props.title || ''}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Video title"
        />
      </div>

      {/* Poster Image */}
      <MediaPicker
        label="Poster Image (optional)"
        value={props.posterImage}
        onChange={(url) => onChange({ posterImage: url })}
      />

      {/* Video Options */}
      <div className="border-t pt-4 space-y-3">
        <h4 className="text-sm font-semibold text-gray-700">Playback Options</h4>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="autoPlay"
            checked={props.autoPlay || false}
            onChange={(e) => onChange({ autoPlay: e.target.checked })}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          />
          <PropertyLabel htmlFor="autoPlay" className="mb-0">
            Auto Play
          </PropertyLabel>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="muted"
            checked={props.muted || false}
            onChange={(e) => onChange({ muted: e.target.checked })}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          />
          <PropertyLabel htmlFor="muted" className="mb-0">
            Muted
          </PropertyLabel>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="loop"
            checked={props.loop || false}
            onChange={(e) => onChange({ loop: e.target.checked })}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          />
          <PropertyLabel htmlFor="loop" className="mb-0">
            Loop
          </PropertyLabel>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="showControls"
            checked={props.showControls !== false}
            onChange={(e) => onChange({ showControls: e.target.checked })}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          />
          <PropertyLabel htmlFor="showControls" className="mb-0">
            Show Controls
          </PropertyLabel>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="lazyLoad"
            checked={props.lazyLoad !== false}
            onChange={(e) => onChange({ lazyLoad: e.target.checked })}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          />
          <PropertyLabel htmlFor="lazyLoad" className="mb-0">
            Lazy Load
          </PropertyLabel>
        </div>
      </div>
    </div>
  )
}
