'use client'

import { useState } from 'react'

interface ThemeConfig {
  primary?: string
  secondary?: string
  accent?: string
  bodyFont?: string
  headingFont?: string
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'full'
  darkMode?: boolean
}

interface BrandingTabProps {
  themeConfig: ThemeConfig
  onChange: (field: string, value: any) => void
}

const GOOGLE_FONTS = [
  { value: 'system-ui', label: 'System UI (Default)' },
  { value: 'Inter', label: 'Inter' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Playfair Display', label: 'Playfair Display' },
  { value: 'Merriweather', label: 'Merriweather' },
  { value: 'Source Sans Pro', label: 'Source Sans Pro' },
  { value: 'Raleway', label: 'Raleway' },
]

const BORDER_RADIUS_OPTIONS = [
  { value: 'none', label: 'None (0px)' },
  { value: 'sm', label: 'Small (0.25rem)' },
  { value: 'md', label: 'Medium (0.5rem)' },
  { value: 'lg', label: 'Large (1rem)' },
  { value: 'full', label: 'Full (9999px)' },
]

export function BrandingTab({ themeConfig, onChange }: BrandingTabProps) {
  const config = {
    primary: themeConfig.primary || '#3b82f6',
    secondary: themeConfig.secondary || '#8b5cf6',
    accent: themeConfig.accent || '#10b981',
    bodyFont: themeConfig.bodyFont || 'system-ui',
    headingFont: themeConfig.headingFont || 'system-ui',
    borderRadius: themeConfig.borderRadius || 'md',
    darkMode: themeConfig.darkMode || false,
  }

  const updateThemeConfig = (field: string, value: any) => {
    onChange('themeConfig', {
      ...themeConfig,
      [field]: value,
    })
  }

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Settings Panel */}
      <div className="space-y-6">
        <div>
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Colors</h3>

          {/* Primary Color */}
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Primary Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={config.primary}
                onChange={(e) => updateThemeConfig('primary', e.target.value)}
                className="h-10 w-20 cursor-pointer rounded border border-gray-300"
              />
              <input
                type="text"
                value={config.primary}
                onChange={(e) => updateThemeConfig('primary', e.target.value)}
                placeholder="#3b82f6"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Secondary Color */}
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Secondary Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={config.secondary}
                onChange={(e) => updateThemeConfig('secondary', e.target.value)}
                className="h-10 w-20 cursor-pointer rounded border border-gray-300"
              />
              <input
                type="text"
                value={config.secondary}
                onChange={(e) => updateThemeConfig('secondary', e.target.value)}
                placeholder="#8b5cf6"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Accent Color */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Accent Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={config.accent}
                onChange={(e) => updateThemeConfig('accent', e.target.value)}
                className="h-10 w-20 cursor-pointer rounded border border-gray-300"
              />
              <input
                type="text"
                value={config.accent}
                onChange={(e) => updateThemeConfig('accent', e.target.value)}
                placeholder="#10b981"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Typography</h3>

          {/* Body Font */}
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Body Font
            </label>
            <select
              value={config.bodyFont}
              onChange={(e) => updateThemeConfig('bodyFont', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              {GOOGLE_FONTS.map((font) => (
                <option key={font.value} value={font.value}>
                  {font.label}
                </option>
              ))}
            </select>
          </div>

          {/* Heading Font */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Heading Font
            </label>
            <select
              value={config.headingFont}
              onChange={(e) => updateThemeConfig('headingFont', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              {GOOGLE_FONTS.map((font) => (
                <option key={font.value} value={font.value}>
                  {font.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Appearance</h3>

          {/* Border Radius */}
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Border Radius
            </label>
            <select
              value={config.borderRadius}
              onChange={(e) => updateThemeConfig('borderRadius', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              {BORDER_RADIUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Dark Mode */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="darkMode"
              checked={config.darkMode}
              onChange={(e) => updateThemeConfig('darkMode', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="darkMode" className="ml-2 block text-sm font-medium text-gray-700">
              Enable Dark Mode
            </label>
          </div>
        </div>
      </div>

      {/* Live Preview Panel */}
      <div>
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Live Preview</h3>
        <div className="rounded-lg border-2 border-gray-200 bg-white p-6 shadow-sm">
          <style jsx>{`
            .preview-container {
              --pf-primary: ${config.primary};
              --pf-secondary: ${config.secondary};
              --pf-accent: ${config.accent};
              --pf-border-radius: ${
                config.borderRadius === 'none' ? '0' :
                config.borderRadius === 'sm' ? '0.25rem' :
                config.borderRadius === 'md' ? '0.5rem' :
                config.borderRadius === 'lg' ? '1rem' :
                '9999px'
              };
            }
            .preview-heading {
              font-family: ${config.headingFont === 'system-ui' ? 'system-ui, -apple-system, sans-serif' : `'${config.headingFont}', sans-serif`};
            }
            .preview-body {
              font-family: ${config.bodyFont === 'system-ui' ? 'system-ui, -apple-system, sans-serif' : `'${config.bodyFont}', sans-serif`};
            }
            .preview-btn-primary {
              background-color: var(--pf-primary);
              border-radius: var(--pf-border-radius);
            }
            .preview-btn-secondary {
              background-color: var(--pf-secondary);
              border-radius: var(--pf-border-radius);
            }
            .preview-accent {
              color: var(--pf-accent);
            }
          `}</style>

          <div className={`preview-container ${config.darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} p-6 rounded-lg`}>
            <h1 className="preview-heading text-2xl font-bold mb-2">
              Welcome to Your Site
            </h1>
            <p className="preview-body text-sm mb-4">
              This is a preview of your theme settings. See how your colors, fonts, and styles look together.
            </p>

            <div className="flex gap-2 mb-4">
              <button className="preview-btn-primary px-4 py-2 text-white text-sm font-medium">
                Primary Button
              </button>
              <button className="preview-btn-secondary px-4 py-2 text-white text-sm font-medium">
                Secondary Button
              </button>
            </div>

            <p className="preview-body text-sm">
              This is some <span className="preview-accent font-semibold">accented text</span> to show the accent color.
            </p>

            <div className={`mt-4 p-4 ${config.darkMode ? 'bg-gray-800' : 'bg-gray-50'}`} style={{ borderRadius: `var(--pf-border-radius)` }}>
              <p className="preview-body text-xs">
                Card with custom border radius
              </p>
            </div>
          </div>
        </div>

        <p className="mt-4 text-xs text-gray-500">
          Changes are applied immediately to your public pages after saving.
        </p>
      </div>
    </div>
  )
}
