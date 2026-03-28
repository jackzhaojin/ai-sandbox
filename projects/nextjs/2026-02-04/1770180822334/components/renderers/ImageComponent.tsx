import React from 'react'
import Image from 'next/image'

export interface ImageComponentProps {
  src: string
  alt: string
  caption?: string
  width?: 'small' | 'medium' | 'large' | 'full'
}

export default function ImageComponent({
  src,
  alt,
  caption,
  width = 'full'
}: ImageComponentProps) {
  // Width variants
  const widthClasses = {
    small: 'max-w-md',
    medium: 'max-w-2xl',
    large: 'max-w-4xl',
    full: 'max-w-full'
  }

  // Return null if no src provided
  if (!src) {
    return (
      <div className="bg-gray-100 rounded-lg p-8 text-center text-gray-500">
        No image selected
      </div>
    )
  }

  return (
    <figure className={`${widthClasses[width]} mx-auto`}>
      <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-100">
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes={
            width === 'small' ? '448px' :
            width === 'medium' ? '768px' :
            width === 'large' ? '1024px' :
            '100vw'
          }
        />
      </div>
      {caption && (
        <figcaption className="mt-3 text-sm text-center text-gray-600 italic">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}
