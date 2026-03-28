'use client'

import { Twitter, Facebook, Instagram, Linkedin, Youtube, Github, Globe } from 'lucide-react'

interface SocialLinks {
  twitter?: string
  facebook?: string
  instagram?: string
  linkedin?: string
  youtube?: string
  github?: string
  tiktok?: string
  website?: string
}

interface SocialLinksTabProps {
  socialLinks: SocialLinks
  onChange: (field: string, value: any) => void
}

const SOCIAL_PLATFORMS = [
  {
    key: 'twitter',
    label: 'Twitter/X',
    icon: Twitter,
    placeholder: 'https://twitter.com/username',
    pattern: 'https://(twitter.com|x.com)/',
  },
  {
    key: 'facebook',
    label: 'Facebook',
    icon: Facebook,
    placeholder: 'https://facebook.com/username',
    pattern: 'https://facebook.com/',
  },
  {
    key: 'instagram',
    label: 'Instagram',
    icon: Instagram,
    placeholder: 'https://instagram.com/username',
    pattern: 'https://instagram.com/',
  },
  {
    key: 'linkedin',
    label: 'LinkedIn',
    icon: Linkedin,
    placeholder: 'https://linkedin.com/in/username',
    pattern: 'https://linkedin.com/',
  },
  {
    key: 'youtube',
    label: 'YouTube',
    icon: Youtube,
    placeholder: 'https://youtube.com/@channel',
    pattern: 'https://youtube.com/',
  },
  {
    key: 'github',
    label: 'GitHub',
    icon: Github,
    placeholder: 'https://github.com/username',
    pattern: 'https://github.com/',
  },
  {
    key: 'tiktok',
    label: 'TikTok',
    icon: Globe,
    placeholder: 'https://tiktok.com/@username',
    pattern: 'https://tiktok.com/',
  },
  {
    key: 'website',
    label: 'Website',
    icon: Globe,
    placeholder: 'https://example.com',
    pattern: 'https://',
  },
]

export function SocialLinksTab({ socialLinks, onChange }: SocialLinksTabProps) {
  const links = {
    twitter: socialLinks.twitter || '',
    facebook: socialLinks.facebook || '',
    instagram: socialLinks.instagram || '',
    linkedin: socialLinks.linkedin || '',
    youtube: socialLinks.youtube || '',
    github: socialLinks.github || '',
    tiktok: socialLinks.tiktok || '',
    website: socialLinks.website || '',
  }

  const updateSocialLink = (platform: string, value: string) => {
    onChange('socialLinks', {
      ...socialLinks,
      [platform]: value,
    })
  }

  const validateUrl = (url: string, pattern: string) => {
    if (!url) return true // Empty is valid
    try {
      const urlObj = new URL(url)
      return urlObj.protocol === 'https:' && url.includes(pattern.replace('https://', ''))
    } catch {
      return false
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm text-blue-900">
          Add your social media profiles. These links can be displayed in your site's header, footer, or other components.
        </p>
      </div>

      {SOCIAL_PLATFORMS.map((platform) => {
        const value = links[platform.key as keyof typeof links]
        const isValid = validateUrl(value, platform.pattern)
        const Icon = platform.icon

        return (
          <div key={platform.key}>
            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
              <Icon className="h-4 w-4" />
              {platform.label}
            </label>
            <input
              type="url"
              value={value}
              onChange={(e) => updateSocialLink(platform.key, e.target.value)}
              placeholder={platform.placeholder}
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none ${
                !isValid && value
                  ? 'border-red-300 focus:border-red-500'
                  : 'border-gray-300 focus:border-blue-500'
              }`}
            />
            {!isValid && value && (
              <p className="mt-1 text-xs text-red-600">
                Please enter a valid URL starting with "https://"
              </p>
            )}
          </div>
        )
      })}

      {/* Preview */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h4 className="mb-3 text-sm font-medium text-gray-900">Social Links Preview</h4>
        <div className="flex flex-wrap gap-2">
          {SOCIAL_PLATFORMS.map((platform) => {
            const value = links[platform.key as keyof typeof links]
            const Icon = platform.icon

            if (!value) return null

            return (
              <a
                key={platform.key}
                href={value}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Icon className="h-4 w-4" />
                <span>{platform.label}</span>
              </a>
            )
          })}
          {Object.values(links).every(v => !v) && (
            <p className="text-sm text-gray-500">No social links added yet</p>
          )}
        </div>
      </div>

      {/* Usage Info */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h4 className="mb-2 text-sm font-medium text-gray-900">Using Social Links in Your Site</h4>
        <p className="text-xs text-gray-600">
          Social links are stored in your site settings and can be accessed in your templates and components.
          You can use them to:
        </p>
        <ul className="mt-2 space-y-1 text-xs text-gray-600">
          <li>• Display social icons in your header or footer</li>
          <li>• Add social sharing buttons to blog posts</li>
          <li>• Include in contact pages or author bios</li>
          <li>• Generate Open Graph metadata for social previews</li>
        </ul>
      </div>
    </div>
  )
}
