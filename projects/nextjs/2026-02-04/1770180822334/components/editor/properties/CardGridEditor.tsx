'use client'

import React from 'react'
import { GripVertical, Trash2, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import PropertyLabel from './PropertyLabel'
import MediaPicker from './MediaPicker'
import type { CardGridProps, Card } from '@/components/renderers/CardGrid'

interface CardGridEditorProps {
  props: CardGridProps
  onChange: (props: Partial<CardGridProps>) => void
}

export default function CardGridEditor({ props, onChange }: CardGridEditorProps) {
  const cards = props.cards || []

  const handleAddCard = () => {
    const newCard: Card = {
      id: `card-${Date.now()}`,
      title: 'New Card',
      description: 'Card description'
    }
    onChange({ cards: [...cards, newCard] })
  }

  const handleUpdateCard = (cardId: string, updates: Partial<Card>) => {
    const updatedCards = cards.map(card =>
      card.id === cardId ? { ...card, ...updates } : card
    )
    onChange({ cards: updatedCards })
  }

  const handleDeleteCard = (cardId: string) => {
    onChange({ cards: cards.filter(card => card.id !== cardId) })
  }

  const handleMoveCard = (index: number, direction: 'up' | 'down') => {
    const newCards = [...cards]
    const targetIndex = direction === 'up' ? index - 1 : index + 1

    if (targetIndex < 0 || targetIndex >= newCards.length) return

    ;[newCards[index], newCards[targetIndex]] = [newCards[targetIndex], newCards[index]]
    onChange({ cards: newCards })
  }

  return (
    <div className="space-y-4">
      {/* Cards List */}
      <div>
        <PropertyLabel>Cards</PropertyLabel>
        <div className="space-y-3">
          {cards.map((card, index) => (
            <div
              key={card.id}
              className="flex items-start gap-2 p-3 border border-gray-300 rounded-lg bg-white"
            >
              {/* Drag Handle */}
              <div className="flex flex-col gap-1 pt-2">
                <button
                  onClick={() => handleMoveCard(index, 'up')}
                  disabled={index === 0}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Move up"
                >
                  <GripVertical className="w-4 h-4" />
                </button>
              </div>

              {/* Card Content */}
              <div className="flex-1 space-y-2">
                <Input
                  value={card.title}
                  onChange={(e) => handleUpdateCard(card.id, { title: e.target.value })}
                  placeholder="Card title"
                  className="font-medium"
                />
                <Input
                  value={card.description}
                  onChange={(e) => handleUpdateCard(card.id, { description: e.target.value })}
                  placeholder="Card description"
                />
                <MediaPicker
                  label="Image (optional)"
                  value={card.image}
                  onChange={(url) => handleUpdateCard(card.id, { image: url, imageAlt: card.imageAlt || card.title })}
                />
                {card.image && (
                  <Input
                    value={card.imageAlt || ''}
                    onChange={(e) => handleUpdateCard(card.id, { imageAlt: e.target.value })}
                    placeholder="Image alt text"
                    className="text-sm"
                  />
                )}
                <div className="flex gap-2">
                  <Input
                    value={card.link || ''}
                    onChange={(e) => handleUpdateCard(card.id, { link: e.target.value })}
                    placeholder="Link URL (optional)"
                    className="flex-1"
                  />
                  <Input
                    value={card.linkText || ''}
                    onChange={(e) => handleUpdateCard(card.id, { linkText: e.target.value })}
                    placeholder="Link text"
                    className="w-32"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => handleMoveCard(index, 'down')}
                  disabled={index === cards.length - 1}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed rotate-180"
                  title="Move down"
                >
                  <GripVertical className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteCard(card.id)}
                  className="text-red-500 hover:text-red-700 p-1"
                  title="Delete card"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={handleAddCard}
            className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:bg-gray-50 flex items-center justify-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            Add Card
          </button>
        </div>
      </div>

      {/* Grid Settings */}
      <div className="border-t pt-4 space-y-3">
        <div>
          <PropertyLabel htmlFor="columns">Columns</PropertyLabel>
          <select
            id="columns"
            value={props.columns || 3}
            onChange={(e) => onChange({ columns: parseInt(e.target.value) as CardGridProps['columns'] })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="2">2 Columns</option>
            <option value="3">3 Columns</option>
            <option value="4">4 Columns</option>
          </select>
        </div>

        <div>
          <PropertyLabel htmlFor="variant">Variant</PropertyLabel>
          <select
            id="variant"
            value={props.variant || 'default'}
            onChange={(e) => onChange({ variant: e.target.value as CardGridProps['variant'] })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="default">Default</option>
            <option value="horizontal">Horizontal</option>
            <option value="minimal">Minimal</option>
            <option value="overlay">Overlay</option>
          </select>
        </div>

        <div>
          <PropertyLabel htmlFor="aspectRatio">Aspect Ratio</PropertyLabel>
          <select
            id="aspectRatio"
            value={props.aspectRatio || '4/3'}
            onChange={(e) => onChange({ aspectRatio: e.target.value as CardGridProps['aspectRatio'] })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="1/1">1:1 (Square)</option>
            <option value="4/3">4:3 (Standard)</option>
            <option value="16/9">16:9 (Widescreen)</option>
            <option value="3/2">3:2 (Classic)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="showHoverEffect"
            checked={props.showHoverEffect !== false}
            onChange={(e) => onChange({ showHoverEffect: e.target.checked })}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          />
          <PropertyLabel htmlFor="showHoverEffect" className="mb-0">
            Show Hover Effect
          </PropertyLabel>
        </div>
      </div>
    </div>
  )
}
