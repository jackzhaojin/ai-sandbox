'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { Play } from 'lucide-react'

export type VideoSource = 'youtube' | 'vimeo' | 'url'

export interface VideoProps {
  source: VideoSource
  videoId?: string // For YouTube/Vimeo
  url?: string // For self-hosted
  posterImage?: string
  title?: string
  autoPlay?: boolean
  muted?: boolean
  loop?: boolean
  showControls?: boolean
  lazyLoad?: boolean
}

export default function Video({
  source,
  videoId,
  url,
  posterImage,
  title = 'Video',
  autoPlay = false,
  muted = false,
  loop = false,
  showControls = true,
  lazyLoad = true
}: VideoProps) {
  const [isLoaded, setIsLoaded] = useState(!lazyLoad)

  const handleLoadVideo = () => {
    setIsLoaded(true)
  }

  // Generate embed URLs for YouTube/Vimeo
  const getEmbedUrl = () => {
    if (source === 'youtube' && videoId) {
      const params = new URLSearchParams({
        autoplay: autoPlay ? '1' : '0',
        mute: muted ? '1' : '0',
        loop: loop ? '1' : '0',
        controls: showControls ? '1' : '0',
        ...(loop && { playlist: videoId }) // Required for loop to work
      })
      return `https://www.youtube.com/embed/${videoId}?${params.toString()}`
    }

    if (source === 'vimeo' && videoId) {
      const params = new URLSearchParams({
        autoplay: autoPlay ? '1' : '0',
        muted: muted ? '1' : '0',
        loop: loop ? '1' : '0',
        controls: showControls ? '1' : '0'
      })
      return `https://player.vimeo.com/video/${videoId}?${params.toString()}`
    }

    return url || ''
  }

  // Render embedded video (YouTube/Vimeo)
  if (source === 'youtube' || source === 'vimeo') {
    const embedUrl = getEmbedUrl()

    return (
      <div className="relative w-full max-w-4xl mx-auto">
        <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
          {/* Lazy load with poster overlay */}
          {lazyLoad && !isLoaded ? (
            <div className="relative w-full h-full">
              {posterImage && (
                <Image
                  src={posterImage}
                  alt={`${title} poster`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                />
              )}

              {/* Dark overlay */}
              <div className="absolute inset-0 bg-black/30" />

              {/* Play button overlay */}
              <button
                type="button"
                onClick={handleLoadVideo}
                aria-label={`Play ${title}`}
                className="absolute inset-0 flex items-center justify-center group cursor-pointer focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-offset-2"
              >
                <div className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-6 transition-all duration-300 group-hover:scale-110 group-hover:shadow-2xl shadow-xl">
                  <Play className="w-12 h-12" fill="currentColor" aria-hidden="true" />
                </div>
              </button>
            </div>
          ) : (
            <iframe
              src={embedUrl}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
              loading={lazyLoad ? 'lazy' : undefined}
            />
          )}
        </div>

        {title && (
          <p className="mt-3 text-sm text-gray-600 text-center">{title}</p>
        )}
      </div>
    )
  }

  // Render self-hosted video
  if (source === 'url' && url) {
    return (
      <div className="relative w-full max-w-4xl mx-auto">
        <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
          {/* Lazy load with poster overlay */}
          {lazyLoad && !isLoaded ? (
            <div className="relative w-full h-full">
              {posterImage && (
                <Image
                  src={posterImage}
                  alt={`${title} poster`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                />
              )}

              {/* Dark overlay */}
              <div className="absolute inset-0 bg-black/30" />

              {/* Play button overlay */}
              <button
                type="button"
                onClick={handleLoadVideo}
                aria-label={`Play ${title}`}
                className="absolute inset-0 flex items-center justify-center group cursor-pointer focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-offset-2"
              >
                <div className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-6 transition-all duration-300 group-hover:scale-110 group-hover:shadow-2xl shadow-xl">
                  <Play className="w-12 h-12" fill="currentColor" aria-hidden="true" />
                </div>
              </button>
            </div>
          ) : (
            <video
              src={url}
              poster={posterImage}
              controls={showControls}
              autoPlay={autoPlay}
              muted={muted}
              loop={loop}
              className="w-full h-full"
              playsInline
              preload={lazyLoad ? 'metadata' : 'auto'}
            >
              <track kind="captions" />
              Your browser does not support the video tag.
            </video>
          )}
        </div>

        {title && (
          <p className="mt-3 text-sm text-gray-600 text-center">{title}</p>
        )}
      </div>
    )
  }

  // Error state: missing required props
  return (
    <div className="relative w-full max-w-4xl mx-auto">
      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center p-6">
          <div className="text-gray-400 mb-2">
            <Play className="w-12 h-12 mx-auto" />
          </div>
          <p className="text-gray-600 font-medium">Video not configured</p>
          <p className="text-gray-500 text-sm mt-1">
            Please provide video source and ID/URL
          </p>
        </div>
      </div>
    </div>
  )
}
