'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import PropertyLabel from './PropertyLabel'
import type { EmbedProps, EmbedMode, EmbedPreset } from '@/components/renderers/Embed'

interface EmbedEditorProps {
  props: EmbedProps
  onChange: (props: Partial<EmbedProps>) => void
}

export default function EmbedEditor({ props, onChange }: EmbedEditorProps) {
  const presetConfigs = {
    'google-maps': {
      label: 'Google Maps',
      placeholder: 'https://maps.google.com/maps?q=...'
    },
    'twitter': {
      label: 'Twitter/X',
      placeholder: 'https://twitter.com/username/status/...'
    },
    'instagram': {
      label: 'Instagram',
      placeholder: 'https://www.instagram.com/p/...'
    },
    'codepen': {
      label: 'CodePen',
      placeholder: 'https://codepen.io/username/pen/...'
    },
    'figma': {
      label: 'Figma',
      placeholder: 'https://www.figma.com/file/...'
    }
  }

  return (
    <div className="space-y-4">
      {/* Mode Selector */}
      <div>
        <PropertyLabel>Embed Mode</PropertyLabel>
        <div className="flex gap-2">
          {(['url', 'html', 'preset'] as EmbedMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => onChange({ mode })}
              className={`flex-1 px-4 py-2 rounded-lg border-2 transition capitalize ${
                props.mode === mode
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              {mode === 'url' ? 'URL' : mode === 'html' ? 'HTML' : 'Preset'}
            </button>
          ))}
        </div>
      </div>

      {/* URL Mode */}
      {props.mode === 'url' && (
        <div>
          <PropertyLabel htmlFor="url">Embed URL</PropertyLabel>
          <Input
            id="url"
            value={props.url || ''}
            onChange={(e) => onChange({ url: e.target.value })}
            placeholder="https://example.com/embed/..."
          />
          <p className="mt-1 text-xs text-gray-500">
            Enter a direct embed URL (iframe src)
          </p>
        </div>
      )}

      {/* HTML Mode */}
      {props.mode === 'html' && (
        <div>
          <PropertyLabel htmlFor="html">Embed HTML</PropertyLabel>
          <Textarea
            id="html"
            value={props.html || ''}
            onChange={(e) => onChange({ html: e.target.value })}
            placeholder="<iframe src=&quot;...&quot;></iframe>"
            rows={6}
            className="font-mono text-sm"
          />
          <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800 font-semibold">⚠️ Security Warning</p>
            <p className="text-xs text-yellow-700 mt-1">
              Only use HTML from trusted sources. Malicious code can compromise your site.
            </p>
          </div>
        </div>
      )}

      {/* Preset Mode */}
      {props.mode === 'preset' && (
        <>
          <div>
            <PropertyLabel htmlFor="preset">Select Preset</PropertyLabel>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(presetConfigs) as EmbedPreset[]).map((preset) => (
                <button
                  key={preset}
                  onClick={() => onChange({ preset })}
                  className={`px-4 py-2 rounded-lg border-2 transition text-sm ${
                    props.preset === preset
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {presetConfigs[preset].label}
                </button>
              ))}
            </div>
          </div>

          {props.preset && (
            <div>
              <PropertyLabel htmlFor="presetUrl">
                {presetConfigs[props.preset].label} URL
              </PropertyLabel>
              <Input
                id="presetUrl"
                value={props.url || ''}
                onChange={(e) => onChange({ url: e.target.value })}
                placeholder={presetConfigs[props.preset].placeholder}
              />
            </div>
          )}
        </>
      )}

      {/* Common Settings */}
      <div className="border-t pt-4 space-y-3">
        <div>
          <PropertyLabel htmlFor="title">Title (for accessibility)</PropertyLabel>
          <Input
            id="title"
            value={props.title || ''}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="Embedded content"
          />
        </div>

        <div>
          <PropertyLabel htmlFor="aspectRatio">Aspect Ratio</PropertyLabel>
          <select
            id="aspectRatio"
            value={props.aspectRatio || '16/9'}
            onChange={(e) => onChange({ aspectRatio: e.target.value as EmbedProps['aspectRatio'] })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="16/9">16:9 (Widescreen)</option>
            <option value="4/3">4:3 (Standard)</option>
            <option value="1/1">1:1 (Square)</option>
            <option value="21/9">21:9 (Ultra-wide)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="allowFullscreen"
            checked={props.allowFullscreen !== false}
            onChange={(e) => onChange({ allowFullscreen: e.target.checked })}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          />
          <PropertyLabel htmlFor="allowFullscreen" className="mb-0">
            Allow Fullscreen
          </PropertyLabel>
        </div>
      </div>
    </div>
  )
}
