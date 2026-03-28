'use client'

import React from 'react'
import { GripVertical, Trash2, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import PropertyLabel from './PropertyLabel'
import MediaPicker from './MediaPicker'
import type { HeaderProps, MenuItem } from '@/components/renderers/Header'

interface HeaderEditorProps {
  props: HeaderProps
  onChange: (props: Partial<HeaderProps>) => void
}

export default function HeaderEditor({ props, onChange }: HeaderEditorProps) {
  const menuItems = props.menuItems || []

  const handleAddMenuItem = () => {
    const newItem: MenuItem = {
      id: `menu-${Date.now()}`,
      type: 'url',
      label: 'New Menu Item',
      url: '#',
      target: '_self'
    }
    onChange({ menuItems: [...menuItems, newItem] })
  }

  const handleUpdateMenuItem = (itemId: string, updates: Partial<MenuItem>) => {
    const updatedItems = menuItems.map(item =>
      item.id === itemId ? { ...item, ...updates } : item
    )
    onChange({ menuItems: updatedItems })
  }

  const handleDeleteMenuItem = (itemId: string) => {
    onChange({ menuItems: menuItems.filter(item => item.id !== itemId) })
  }

  const handleMoveMenuItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...menuItems]
    const targetIndex = direction === 'up' ? index - 1 : index + 1

    if (targetIndex < 0 || targetIndex >= newItems.length) return

    ;[newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]]
    onChange({ menuItems: newItems })
  }

  return (
    <div className="space-y-4">
      {/* Logo */}
      <div>
        <PropertyLabel>Logo</PropertyLabel>
        <MediaPicker
          label=""
          value={props.logo?.src}
          onChange={(url) => onChange({
            logo: url ? {
              src: url,
              alt: props.logo?.alt || 'Site logo',
              width: props.logo?.width || 150,
              height: props.logo?.height || 50
            } : undefined
          })}
        />
        {props.logo?.src && (
          <div className="mt-2 space-y-2">
            <Input
              value={props.logo.alt}
              onChange={(e) => onChange({
                logo: { ...props.logo!, alt: e.target.value }
              })}
              placeholder="Logo alt text"
            />
            <div className="flex gap-2">
              <Input
                type="number"
                value={props.logo.width || 150}
                onChange={(e) => onChange({
                  logo: { ...props.logo!, width: parseInt(e.target.value) || 150 }
                })}
                placeholder="Width"
                className="w-24"
              />
              <Input
                type="number"
                value={props.logo.height || 50}
                onChange={(e) => onChange({
                  logo: { ...props.logo!, height: parseInt(e.target.value) || 50 }
                })}
                placeholder="Height"
                className="w-24"
              />
            </div>
          </div>
        )}
      </div>

      {/* Menu Items */}
      <div className="border-t pt-4">
        <PropertyLabel>Navigation Menu</PropertyLabel>
        <div className="space-y-2">
          {menuItems.map((item, index) => (
            <div
              key={item.id}
              className="flex items-start gap-2 p-3 border border-gray-300 rounded-lg bg-white"
            >
              {/* Drag Handle */}
              <div className="flex flex-col gap-1 pt-2">
                <button
                  onClick={() => handleMoveMenuItem(index, 'up')}
                  disabled={index === 0}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Move up"
                >
                  <GripVertical className="w-4 h-4" />
                </button>
              </div>

              {/* Menu Item Content */}
              <div className="flex-1 space-y-2">
                <Input
                  value={item.label}
                  onChange={(e) => handleUpdateMenuItem(item.id, { label: e.target.value })}
                  placeholder="Menu label"
                  className="font-medium"
                />
                <Input
                  value={item.url}
                  onChange={(e) => handleUpdateMenuItem(item.id, { url: e.target.value })}
                  placeholder="URL or path"
                />
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => handleMoveMenuItem(index, 'down')}
                  disabled={index === menuItems.length - 1}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed rotate-180"
                  title="Move down"
                >
                  <GripVertical className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteMenuItem(item.id)}
                  className="text-red-500 hover:text-red-700 p-1"
                  title="Delete item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={handleAddMenuItem}
            className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:bg-gray-50 flex items-center justify-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            Add Menu Item
          </button>
        </div>
      </div>

      {/* CTA Button */}
      <div className="border-t pt-4">
        <PropertyLabel>CTA Button (optional)</PropertyLabel>
        <div className="space-y-2">
          <Input
            value={props.ctaButton?.text || ''}
            onChange={(e) => onChange({
              ctaButton: e.target.value ? {
                text: e.target.value,
                url: props.ctaButton?.url || '#'
              } : undefined
            })}
            placeholder="Button text (e.g., Get Started)"
          />
          {props.ctaButton?.text && (
            <Input
              value={props.ctaButton.url}
              onChange={(e) => onChange({
                ctaButton: { ...props.ctaButton!, url: e.target.value }
              })}
              placeholder="Button URL"
            />
          )}
        </div>
      </div>

      {/* Variant */}
      <div className="border-t pt-4">
        <PropertyLabel htmlFor="variant">Variant</PropertyLabel>
        <select
          id="variant"
          value={props.variant || 'default'}
          onChange={(e) => onChange({ variant: e.target.value as HeaderProps['variant'] })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="default">Default</option>
          <option value="centered">Centered</option>
          <option value="transparent">Transparent</option>
          <option value="minimal">Minimal</option>
        </select>
      </div>

      {/* Sticky */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="sticky"
          checked={props.sticky !== false}
          onChange={(e) => onChange({ sticky: e.target.checked })}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
        />
        <PropertyLabel htmlFor="sticky" className="mb-0">
          Sticky on Scroll
        </PropertyLabel>
      </div>
    </div>
  )
}
