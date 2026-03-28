'use client'

import React from 'react'
import { GripVertical, Trash2, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import PropertyLabel from './PropertyLabel'
import MediaPicker from './MediaPicker'
import type { FooterProps, FooterMenuItem, SocialLink } from '@/components/renderers/Footer'

interface FooterEditorProps {
  props: FooterProps
  onChange: (props: Partial<FooterProps>) => void
}

export default function FooterEditor({ props, onChange }: FooterEditorProps) {
  const menuItems = props.menuItems || []
  const socialLinks = props.socialLinks || []
  const bottomLinks = props.bottomLinks || []

  // Menu Items
  const handleAddMenuItem = () => {
    const newItem: FooterMenuItem = {
      id: `menu-${Date.now()}`,
      type: 'url',
      label: 'New Menu Item',
      url: '#',
      target: '_self'
    }
    onChange({ menuItems: [...menuItems, newItem] })
  }

  const handleUpdateMenuItem = (itemId: string, updates: Partial<FooterMenuItem>) => {
    const updatedItems = menuItems.map(item =>
      item.id === itemId ? { ...item, ...updates } : item
    )
    onChange({ menuItems: updatedItems })
  }

  const handleDeleteMenuItem = (itemId: string) => {
    onChange({ menuItems: menuItems.filter(item => item.id !== itemId) })
  }

  // Social Links
  const handleAddSocialLink = () => {
    const newLink: SocialLink = {
      platform: 'twitter',
      url: 'https://twitter.com/username'
    }
    onChange({ socialLinks: [...socialLinks, newLink] })
  }

  const handleUpdateSocialLink = (index: number, updates: Partial<SocialLink>) => {
    const updatedLinks = socialLinks.map((link, i) =>
      i === index ? { ...link, ...updates } : link
    )
    onChange({ socialLinks: updatedLinks })
  }

  const handleDeleteSocialLink = (index: number) => {
    onChange({ socialLinks: socialLinks.filter((_, i) => i !== index) })
  }

  // Bottom Links
  const handleAddBottomLink = () => {
    const newLink = { label: 'New Link', url: '#' }
    onChange({ bottomLinks: [...bottomLinks, newLink] })
  }

  const handleUpdateBottomLink = (index: number, updates: { label?: string; url?: string }) => {
    const updatedLinks = bottomLinks.map((link, i) =>
      i === index ? { ...link, ...updates } : link
    )
    onChange({ bottomLinks: updatedLinks })
  }

  const handleDeleteBottomLink = (index: number) => {
    onChange({ bottomLinks: bottomLinks.filter((_, i) => i !== index) })
  }

  return (
    <div className="space-y-4">
      {/* Logo */}
      <div>
        <PropertyLabel>Logo (optional)</PropertyLabel>
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
          <Input
            value={props.logo.alt}
            onChange={(e) => onChange({
              logo: { ...props.logo!, alt: e.target.value }
            })}
            placeholder="Logo alt text"
            className="mt-2"
          />
        )}
      </div>

      {/* Menu Columns */}
      <div className="border-t pt-4">
        <PropertyLabel>Menu Columns</PropertyLabel>
        <div className="space-y-2">
          {menuItems.map((item, index) => (
            <div
              key={item.id}
              className="flex items-start gap-2 p-3 border border-gray-300 rounded-lg bg-white"
            >
              <div className="flex-1 space-y-2">
                <Input
                  value={item.label}
                  onChange={(e) => handleUpdateMenuItem(item.id, { label: e.target.value })}
                  placeholder="Column/Link label"
                  className="font-medium"
                />
                <Input
                  value={item.url}
                  onChange={(e) => handleUpdateMenuItem(item.id, { url: e.target.value })}
                  placeholder="URL"
                />
              </div>
              <button
                onClick={() => handleDeleteMenuItem(item.id)}
                className="text-red-500 hover:text-red-700 p-1 mt-1"
                title="Delete item"
              >
                <Trash2 className="w-4 h-4" />
              </button>
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

      {/* Social Links */}
      <div className="border-t pt-4">
        <PropertyLabel>Social Links</PropertyLabel>
        <div className="space-y-2">
          {socialLinks.map((link, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg bg-white"
            >
              <select
                value={link.platform}
                onChange={(e) => handleUpdateSocialLink(index, { platform: e.target.value as SocialLink['platform'] })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="facebook">Facebook</option>
                <option value="twitter">Twitter/X</option>
                <option value="instagram">Instagram</option>
                <option value="linkedin">LinkedIn</option>
                <option value="youtube">YouTube</option>
                <option value="github">GitHub</option>
              </select>
              <Input
                value={link.url}
                onChange={(e) => handleUpdateSocialLink(index, { url: e.target.value })}
                placeholder="Profile URL"
                className="flex-1"
              />
              <button
                onClick={() => handleDeleteSocialLink(index)}
                className="text-red-500 hover:text-red-700 p-1"
                title="Delete link"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          <button
            onClick={handleAddSocialLink}
            className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:bg-gray-50 flex items-center justify-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            Add Social Link
          </button>
        </div>
      </div>

      {/* Newsletter */}
      <div className="border-t pt-4">
        <div className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            id="showNewsletter"
            checked={props.showNewsletter || false}
            onChange={(e) => onChange({ showNewsletter: e.target.checked })}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          />
          <PropertyLabel htmlFor="showNewsletter" className="mb-0">
            Show Newsletter Signup
          </PropertyLabel>
        </div>

        {props.showNewsletter && (
          <div className="space-y-2">
            <Input
              value={props.newsletterTitle || ''}
              onChange={(e) => onChange({ newsletterTitle: e.target.value })}
              placeholder="Newsletter title"
            />
            <Input
              value={props.newsletterDescription || ''}
              onChange={(e) => onChange({ newsletterDescription: e.target.value })}
              placeholder="Newsletter description"
            />
          </div>
        )}
      </div>

      {/* Bottom Links */}
      <div className="border-t pt-4">
        <PropertyLabel>Bottom Links (Privacy, Terms, etc.)</PropertyLabel>
        <div className="space-y-2">
          {bottomLinks.map((link, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-2 border border-gray-300 rounded-lg bg-white"
            >
              <Input
                value={link.label}
                onChange={(e) => handleUpdateBottomLink(index, { label: e.target.value })}
                placeholder="Link label"
                className="flex-1 text-sm"
              />
              <Input
                value={link.url}
                onChange={(e) => handleUpdateBottomLink(index, { url: e.target.value })}
                placeholder="URL"
                className="flex-1 text-sm"
              />
              <button
                onClick={() => handleDeleteBottomLink(index)}
                className="text-red-500 hover:text-red-700 p-1"
                title="Delete link"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}

          <button
            onClick={handleAddBottomLink}
            className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:bg-gray-50 flex items-center justify-center gap-2 transition text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Bottom Link
          </button>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t pt-4">
        <PropertyLabel htmlFor="copyrightText">Copyright Text</PropertyLabel>
        <Input
          id="copyrightText"
          value={props.copyrightText || ''}
          onChange={(e) => onChange({ copyrightText: e.target.value })}
          placeholder="© 2024 Company Name. All rights reserved."
        />
      </div>

      {/* Variant */}
      <div>
        <PropertyLabel htmlFor="variant">Variant</PropertyLabel>
        <select
          id="variant"
          value={props.variant || 'columns'}
          onChange={(e) => onChange({ variant: e.target.value as FooterProps['variant'] })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="columns">Columns</option>
          <option value="simple">Simple</option>
          <option value="centered">Centered</option>
        </select>
      </div>
    </div>
  )
}
