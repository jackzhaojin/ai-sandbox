'use client'

import React from 'react'
import { GripVertical, Trash2, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import PropertyLabel from './PropertyLabel'
import MediaPicker from './MediaPicker'
import type { CarouselProps, CarouselSlide } from '@/components/renderers/Carousel'

interface CarouselEditorProps {
  props: CarouselProps
  onChange: (props: Partial<CarouselProps>) => void
}

export default function CarouselEditor({ props, onChange }: CarouselEditorProps) {
  const slides = props.slides || []

  const handleAddSlide = () => {
    const newSlide: CarouselSlide = {
      id: `slide-${Date.now()}`,
      src: '',
      alt: 'Slide image',
      caption: ''
    }
    onChange({ slides: [...slides, newSlide] })
  }

  const handleUpdateSlide = (slideId: string, updates: Partial<CarouselSlide>) => {
    const updatedSlides = slides.map(slide =>
      slide.id === slideId ? { ...slide, ...updates } : slide
    )
    onChange({ slides: updatedSlides })
  }

  const handleDeleteSlide = (slideId: string) => {
    onChange({ slides: slides.filter(slide => slide.id !== slideId) })
  }

  const handleMoveSlide = (index: number, direction: 'up' | 'down') => {
    const newSlides = [...slides]
    const targetIndex = direction === 'up' ? index - 1 : index + 1

    if (targetIndex < 0 || targetIndex >= newSlides.length) return

    ;[newSlides[index], newSlides[targetIndex]] = [newSlides[targetIndex], newSlides[index]]
    onChange({ slides: newSlides })
  }

  return (
    <div className="space-y-4">
      {/* Slides List */}
      <div>
        <PropertyLabel>Slides</PropertyLabel>
        <div className="space-y-3">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className="flex items-start gap-2 p-3 border border-gray-300 rounded-lg bg-white"
            >
              {/* Drag Handle */}
              <div className="flex flex-col gap-1 pt-2">
                <button
                  onClick={() => handleMoveSlide(index, 'up')}
                  disabled={index === 0}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Move up"
                >
                  <GripVertical className="w-4 h-4" />
                </button>
              </div>

              {/* Slide Content */}
              <div className="flex-1 space-y-2">
                <MediaPicker
                  label="Image"
                  value={slide.src}
                  onChange={(url) => handleUpdateSlide(slide.id, { src: url })}
                />
                <Input
                  value={slide.alt}
                  onChange={(e) => handleUpdateSlide(slide.id, { alt: e.target.value })}
                  placeholder="Alt text"
                />
                <Input
                  value={slide.caption || ''}
                  onChange={(e) => handleUpdateSlide(slide.id, { caption: e.target.value })}
                  placeholder="Caption (optional)"
                />
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => handleMoveSlide(index, 'down')}
                  disabled={index === slides.length - 1}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed rotate-180"
                  title="Move down"
                >
                  <GripVertical className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteSlide(slide.id)}
                  className="text-red-500 hover:text-red-700 p-1"
                  title="Delete slide"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={handleAddSlide}
            className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:bg-gray-50 flex items-center justify-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            Add Slide
          </button>
        </div>
      </div>

      {/* Variant */}
      <div>
        <PropertyLabel htmlFor="variant">Variant</PropertyLabel>
        <select
          id="variant"
          value={props.variant || 'full-width'}
          onChange={(e) => onChange({ variant: e.target.value as CarouselProps['variant'] })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="full-width">Full Width</option>
          <option value="cards-with-peek">Cards with Peek</option>
          <option value="thumbnails">Thumbnails</option>
        </select>
      </div>

      {/* Auto Play */}
      <div className="border-t pt-4">
        <div className="flex items-center gap-2 mb-3">
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

        {props.autoPlay && (
          <div>
            <PropertyLabel htmlFor="interval">
              Interval (seconds): {((props.interval || 5000) / 1000).toFixed(1)}s
            </PropertyLabel>
            <input
              type="range"
              id="interval"
              min="2000"
              max="10000"
              step="500"
              value={props.interval || 5000}
              onChange={(e) => onChange({ interval: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        )}
      </div>

      {/* Show Controls */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="showControls"
          checked={props.showControls !== false}
          onChange={(e) => onChange({ showControls: e.target.checked })}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
        />
        <PropertyLabel htmlFor="showControls" className="mb-0">
          Show Navigation Controls
        </PropertyLabel>
      </div>
    </div>
  )
}
