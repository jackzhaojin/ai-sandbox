import React from 'react'

export interface CTAProps {
  heading: string
  description?: string
  buttonText: string
  buttonLink: string
  backgroundColor?: 'primary' | 'secondary' | 'gray'
  variant?: 'primary' | 'secondary' | 'outline'
}

export default function CTA({
  heading,
  description,
  buttonText,
  buttonLink,
  backgroundColor = 'primary',
  variant = 'primary'
}: CTAProps) {
  // Background color variants
  const backgroundClasses = {
    primary: 'bg-blue-600 text-white',
    secondary: 'bg-purple-600 text-white',
    gray: 'bg-gray-100 text-gray-900'
  }

  // Button variant classes
  const buttonVariants = {
    primary: 'bg-white text-blue-600 hover:bg-gray-50 focus:ring-white',
    secondary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    outline: 'bg-transparent text-white border-2 border-white hover:bg-white/10 focus:ring-white'
  }

  // Adjust button variant based on background
  const effectiveVariant = backgroundColor === 'gray' ? 'secondary' : variant

  return (
    <section
      className={`w-full py-16 sm:py-20 lg:py-24 ${backgroundClasses[backgroundColor]}`}
      role="complementary"
      aria-label="Call to action"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <div className="text-center flex flex-col items-center gap-6">
          {/* Heading */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            {heading}
          </h2>

          {/* Description */}
          {description && (
            <p className={`text-lg sm:text-xl max-w-2xl ${
              backgroundColor === 'gray' ? 'text-gray-600' : 'text-white/90'
            }`}>
              {description}
            </p>
          )}

          {/* CTA Button */}
          <a
            href={buttonLink}
            className={`inline-flex items-center justify-center px-8 py-4 text-base sm:text-lg font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${buttonVariants[effectiveVariant]}`}
            aria-label={buttonText}
          >
            {buttonText}
          </a>
        </div>
      </div>
    </section>
  )
}
