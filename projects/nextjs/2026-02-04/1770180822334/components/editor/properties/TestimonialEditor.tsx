'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import MediaPicker from './MediaPicker'
import PropertyLabel from './PropertyLabel'
import type { TestimonialProps } from '@/components/renderers/Testimonial'

interface TestimonialEditorProps {
  props: TestimonialProps
  onChange: (props: Partial<TestimonialProps>) => void
}

export default function TestimonialEditor({ props, onChange }: TestimonialEditorProps) {
  const handleChange = (key: keyof TestimonialProps, value: string | number) => {
    onChange({ [key]: value })
  }

  return (
    <div className="space-y-4">
      {/* Quote */}
      <div>
        <PropertyLabel htmlFor="quote" required>Quote</PropertyLabel>
        <Textarea
          id="quote"
          value={props.quote || ''}
          onChange={(e) => handleChange('quote', e.target.value)}
          placeholder="Enter the testimonial quote"
          rows={4}
        />
      </div>

      {/* Author */}
      <div>
        <PropertyLabel htmlFor="author" required>Author Name</PropertyLabel>
        <Input
          id="author"
          value={props.author || ''}
          onChange={(e) => handleChange('author', e.target.value)}
          placeholder="e.g., John Doe"
        />
      </div>

      {/* Role */}
      <div>
        <PropertyLabel htmlFor="role">Role / Title</PropertyLabel>
        <Input
          id="role"
          value={props.role || ''}
          onChange={(e) => handleChange('role', e.target.value)}
          placeholder="e.g., CEO at Company"
        />
      </div>

      {/* Avatar */}
      <MediaPicker
        label="Avatar Image"
        value={props.avatar}
        onChange={(url) => handleChange('avatar', url)}
      />

      {/* Rating */}
      <div>
        <PropertyLabel htmlFor="rating">Rating (Stars)</PropertyLabel>
        <div className="flex gap-2 items-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => handleChange('rating', star)}
              className="focus:outline-none"
              title={`${star} star${star > 1 ? 's' : ''}`}
            >
              <svg
                className={`w-8 h-8 transition ${
                  star <= (props.rating || 5)
                    ? 'text-yellow-400'
                    : 'text-gray-300 hover:text-yellow-200'
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          ))}
          <span className="ml-2 text-sm text-gray-600">
            {props.rating || 5} / 5
          </span>
        </div>
      </div>
    </div>
  )
}
