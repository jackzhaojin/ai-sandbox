import React from 'react'
import Image from 'next/image'

export interface HeroProps {
  heading: string
  subheading?: string
  primaryButtonText?: string
  primaryButtonLink?: string
  secondaryButtonText?: string
  secondaryButtonLink?: string
  backgroundImage?: string
  height?: 'small' | 'medium' | 'large'
  alignment?: 'left' | 'center' | 'right'
}

export default function Hero({
  heading,
  subheading,
  primaryButtonText,
  primaryButtonLink,
  secondaryButtonText,
  secondaryButtonLink,
  backgroundImage,
  height = 'large',
  alignment = 'center'
}: HeroProps) {
  // Height variants
  const heightClasses = {
    small: 'min-h-[300px] py-12',
    medium: 'min-h-[500px] py-20',
    large: 'min-h-[700px] py-28'
  }

  // Alignment variants
  const alignmentClasses = {
    left: 'text-left items-start',
    center: 'text-center items-center',
    right: 'text-right items-end'
  }

  return (
    <section
      className={`relative w-full ${heightClasses[height]} flex items-center justify-center overflow-hidden`}
      role="banner"
    >
      {/* Background Image */}
      {backgroundImage && (
        <div className="absolute inset-0 z-0">
          <Image
            src={backgroundImage}
            alt=""
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-black/40" />
        </div>
      )}

      {/* Content Container */}
      <div className={`relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl`}>
        <div className={`flex flex-col gap-6 ${alignmentClasses[alignment]}`}>
          {/* Heading */}
          <h1
            className={`text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight ${
              backgroundImage ? 'text-white' : 'text-gray-900'
            }`}
          >
            {heading}
          </h1>

          {/* Subheading */}
          {subheading && (
            <p
              className={`text-lg sm:text-xl lg:text-2xl max-w-3xl ${
                backgroundImage ? 'text-white/90' : 'text-gray-600'
              }`}
            >
              {subheading}
            </p>
          )}

          {/* CTA Buttons */}
          {(primaryButtonText || secondaryButtonText) && (
            <div className={`flex flex-wrap gap-4 ${alignment === 'center' ? 'justify-center' : alignment === 'right' ? 'justify-end' : 'justify-start'}`}>
              {primaryButtonText && (
                <a
                  href={primaryButtonLink || '#'}
                  className="inline-flex items-center justify-center px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label={primaryButtonText}
                >
                  {primaryButtonText}
                </a>
              )}
              {secondaryButtonText && (
                <a
                  href={secondaryButtonLink || '#'}
                  className={`inline-flex items-center justify-center px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg font-semibold rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    backgroundImage
                      ? 'text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/30 focus:ring-white'
                      : 'text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 focus:ring-blue-500'
                  }`}
                  aria-label={secondaryButtonText}
                >
                  {secondaryButtonText}
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
