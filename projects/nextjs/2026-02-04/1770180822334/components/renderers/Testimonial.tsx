import React from 'react'
import Image from 'next/image'

export interface TestimonialProps {
  quote: string
  author: string
  role?: string
  avatar?: string
  rating?: number
}

export default function Testimonial({
  quote,
  author,
  role,
  avatar,
  rating = 5
}: TestimonialProps) {
  // Generate star rating display
  const renderStars = () => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <svg
          key={i}
          className={`w-5 h-5 ${i <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      )
    }
    return stars
  }

  return (
    <figure
      className="bg-white rounded-2xl shadow-lg p-8 sm:p-10 max-w-3xl mx-auto"
      role="blockquote"
    >
      {/* Rating */}
      {rating > 0 && (
        <div className="flex items-center gap-1 mb-6" aria-label={`Rating: ${rating} out of 5 stars`}>
          {renderStars()}
        </div>
      )}

      {/* Quote */}
      <blockquote className="text-lg sm:text-xl text-gray-900 mb-8 leading-relaxed">
        <span className="text-4xl text-blue-600 leading-none" aria-hidden="true">"</span>
        {quote}
        <span className="text-4xl text-blue-600 leading-none" aria-hidden="true">"</span>
      </blockquote>

      {/* Author Info */}
      <figcaption className="flex items-center gap-4">
        {/* Avatar */}
        {avatar ? (
          <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden flex-shrink-0 bg-gray-200">
            <Image
              src={avatar}
              alt={`${author}'s avatar`}
              fill
              className="object-cover"
              sizes="56px"
            />
          </div>
        ) : (
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-semibold text-lg sm:text-xl">
              {author.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        {/* Author Details */}
        <div className="flex flex-col">
          <cite className="text-base sm:text-lg font-semibold text-gray-900 not-italic">
            {author}
          </cite>
          {role && (
            <p className="text-sm sm:text-base text-gray-600">
              {role}
            </p>
          )}
        </div>
      </figcaption>
    </figure>
  )
}
