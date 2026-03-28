'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'

export interface CarouselSlide {
  id: string
  src: string
  alt: string
  caption?: string
}

export interface CarouselProps {
  slides: CarouselSlide[]
  autoPlay?: boolean
  interval?: number
  variant?: 'full-width' | 'cards-with-peek' | 'thumbnails'
  showControls?: boolean
}

export default function Carousel({
  slides,
  autoPlay = false,
  interval = 5000,
  variant = 'full-width',
  showControls = true
}: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [isPaused, setIsPaused] = useState(false)

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1))
  }, [slides.length])

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1))
  }, [slides.length])

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  // Auto-play effect
  useEffect(() => {
    if (!isPlaying || isPaused) return

    const timer = setInterval(() => {
      goToNext()
    }, interval)

    return () => clearInterval(timer)
  }, [isPlaying, isPaused, interval, goToNext])

  // Keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault()
        goToPrevious()
        break
      case 'ArrowRight':
        event.preventDefault()
        goToNext()
        break
      case ' ':
      case 'Enter':
        event.preventDefault()
        togglePlayPause()
        break
    }
  }

  // Variant-specific container classes
  const containerClasses = {
    'full-width': 'w-full',
    'cards-with-peek': 'w-full max-w-5xl mx-auto px-12',
    thumbnails: 'w-full max-w-4xl mx-auto'
  }

  const slideContainerClasses = {
    'full-width': 'aspect-video',
    'cards-with-peek': 'aspect-video rounded-xl shadow-2xl',
    thumbnails: 'aspect-video rounded-lg'
  }

  const currentSlide = slides[currentIndex]

  return (
    <div
      className={`relative ${containerClasses[variant]}`}
      role="region"
      aria-label="Image carousel"
      aria-roledescription="carousel"
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slides */}
      <div className={`relative ${slideContainerClasses[variant]} overflow-hidden bg-gray-900`}>
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-all duration-700 ease-in-out ${index === currentIndex ? 'opacity-100 translate-x-0' : 'opacity-0'} ${index < currentIndex ? '-translate-x-full' : ''} ${index > currentIndex ? 'translate-x-full' : ''}`}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${slides.length}`}
            aria-hidden={index !== currentIndex}
          >
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              className="object-cover"
              priority={index === 0}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
            />
            {slide.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-6 py-4">
                <p className="text-white text-sm md:text-base font-medium">
                  {slide.caption}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Navigation Controls */}
      {showControls && slides.length > 1 && (
        <>
          {/* Previous Button */}
          <button
            type="button"
            onClick={goToPrevious}
            aria-label="Previous slide"
            className={`absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white text-gray-900 rounded-full p-2 shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${variant === 'cards-with-peek' ? 'left-2' : ''}`}
          >
            <ChevronLeft className="w-6 h-6" aria-hidden="true" />
          </button>

          {/* Next Button */}
          <button
            type="button"
            onClick={goToNext}
            aria-label="Next slide"
            className={`absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white text-gray-900 rounded-full p-2 shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${variant === 'cards-with-peek' ? 'right-2' : ''}`}
          >
            <ChevronRight className="w-6 h-6" aria-hidden="true" />
          </button>

          {/* Play/Pause Button (for accessibility) */}
          {autoPlay && (
            <button
              type="button"
              onClick={togglePlayPause}
              aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
              className="absolute top-4 right-4 z-10 bg-white/90 hover:bg-white text-gray-900 rounded-full p-2 shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" aria-hidden="true" />
              ) : (
                <Play className="w-5 h-5" aria-hidden="true" />
              )}
            </button>
          )}
        </>
      )}

      {/* Dot Indicators */}
      {slides.length > 1 && (
        <div
          className="flex justify-center items-center gap-2 mt-4"
          role="tablist"
          aria-label="Slide navigation"
        >
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => goToSlide(index)}
              role="tab"
              aria-selected={index === currentIndex}
              aria-label={`Go to slide ${index + 1}`}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${index === currentIndex ? 'bg-blue-600 w-8' : 'bg-gray-400 hover:bg-gray-500'}`}
            />
          ))}
        </div>
      )}

      {/* Thumbnails (for thumbnails variant) */}
      {variant === 'thumbnails' && slides.length > 1 && (
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
              className={`relative flex-shrink-0 w-20 h-14 rounded overflow-hidden border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${index === currentIndex ? 'border-blue-600 opacity-100' : 'border-gray-300 opacity-60 hover:opacity-100'}`}
            >
              <Image
                src={slide.src}
                alt={`Thumbnail ${index + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}

      <style jsx>{`
        @media (prefers-reduced-motion: reduce) {
          .transition-all {
            transition-duration: 0.01ms !important;
          }
        }

        /* Smooth scrolling for thumbnail strip */
        .overflow-x-auto {
          -webkit-overflow-scrolling: touch;
          scrollbar-width: thin;
          scrollbar-color: #9ca3af #f3f4f6;
        }

        .overflow-x-auto::-webkit-scrollbar {
          height: 6px;
        }

        .overflow-x-auto::-webkit-scrollbar-track {
          background: #f3f4f6;
          border-radius: 3px;
        }

        .overflow-x-auto::-webkit-scrollbar-thumb {
          background: #9ca3af;
          border-radius: 3px;
        }

        .overflow-x-auto::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
      `}</style>
    </div>
  )
}
