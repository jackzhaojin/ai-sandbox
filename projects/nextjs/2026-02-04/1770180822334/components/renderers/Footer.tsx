'use client'

import React, { useState, useEffect, FormEvent } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Facebook, Twitter, Instagram, Linkedin, Youtube, Github, Mail, CheckCircle2, AlertCircle } from 'lucide-react'

export interface FooterMenuItem {
  id: string
  type: 'page' | 'url' | 'fragment' | 'divider'
  label: string
  icon?: string
  target?: '_self' | '_blank'
  cssClass?: string
  pageId?: string
  url?: string
  fragmentId?: string
  children?: FooterMenuItem[]
}

export interface SocialLink {
  platform: 'facebook' | 'twitter' | 'instagram' | 'linkedin' | 'youtube' | 'github'
  url: string
}

export interface FooterProps {
  menuItems?: FooterMenuItem[]
  socialLinks?: SocialLink[]
  logo?: {
    src: string
    alt: string
    width?: number
    height?: number
  }
  copyrightText?: string
  bottomLinks?: { label: string; url: string }[]
  showNewsletter?: boolean
  newsletterTitle?: string
  newsletterDescription?: string
  variant?: 'columns' | 'simple' | 'centered'
  siteId?: string // For fetching menu from API
}

export default function Footer({
  menuItems = [],
  socialLinks = [],
  logo,
  copyrightText,
  bottomLinks = [],
  showNewsletter = false,
  newsletterTitle = 'Subscribe to our newsletter',
  newsletterDescription = 'Get the latest updates delivered to your inbox.',
  variant = 'columns',
  siteId
}: FooterProps) {
  const [menuData, setMenuData] = useState<FooterMenuItem[]>(menuItems)
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const getItemHref = (item: FooterMenuItem): string => {
    if (item.type === 'page' && item.pageId) {
      return `/page/${item.pageId}` // Adjust based on your routing
    }
    if (item.type === 'url' && item.url) {
      return item.url
    }
    if (item.type === 'fragment' && item.fragmentId) {
      return `#${item.fragmentId}`
    }
    return '#'
  }

  // Fetch menu data if siteId is provided
  useEffect(() => {
    if (siteId && menuItems.length === 0) {
      fetch(`/api/menus?siteId=${siteId}&location=footer`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.items) {
            setMenuData(data.items)
          }
        })
        .catch((err) => {
          console.error('Failed to fetch footer menu:', err)
        })
    }
  }, [siteId, menuItems.length])

  const handleNewsletterSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!email) return

    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      })

      if (!response.ok) {
        throw new Error('Failed to subscribe')
      }

      setSubmitStatus('success')
      setEmail('')

      // Reset success message after 5 seconds
      setTimeout(() => {
        setSubmitStatus('idle')
      }, 5000)
    } catch (error) {
      console.error('Newsletter subscription error:', error)
      setSubmitStatus('error')

      // Reset error message after 5 seconds
      setTimeout(() => {
        setSubmitStatus('idle')
      }, 5000)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getSocialIcon = (platform: string) => {
    const iconClass = 'w-5 h-5'
    switch (platform) {
      case 'facebook':
        return <Facebook className={iconClass} />
      case 'twitter':
        return <Twitter className={iconClass} />
      case 'instagram':
        return <Instagram className={iconClass} />
      case 'linkedin':
        return <Linkedin className={iconClass} />
      case 'youtube':
        return <Youtube className={iconClass} />
      case 'github':
        return <Github className={iconClass} />
      default:
        return null
    }
  }

  const renderColumnsVariant = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      {/* Logo and description column */}
      <div>
        {logo && (
          <Link href="/" className="inline-block mb-4">
            <Image
              src={logo.src}
              alt={logo.alt}
              width={logo.width || 120}
              height={logo.height || 32}
              className="h-8 w-auto"
            />
          </Link>
        )}
        {socialLinks.length > 0 && (
          <div className="flex space-x-4 mt-4">
            {socialLinks.map((link) => (
              <a
                key={link.platform}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={`Follow us on ${link.platform}`}
              >
                {getSocialIcon(link.platform)}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Menu columns */}
      {menuData.map((column) => {
        if (column.type === 'divider') return null
        return (
          <div key={column.id}>
            <h3 className="font-semibold text-gray-900 mb-4">{column.label}</h3>
            {column.children && column.children.length > 0 && (
              <ul className="space-y-2">
                {column.children.map((item) => {
                  if (item.type === 'divider') {
                    return <li key={item.id} className="border-t border-gray-300 my-2" />
                  }
                  const href = getItemHref(item)
                  const target = item.target || '_self'
                  return (
                    <li key={item.id}>
                      <Link
                        href={href}
                        target={target}
                        className={`text-gray-600 hover:text-gray-900 transition-colors text-sm ${item.cssClass || ''}`}
                      >
                        {item.label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )
      })}

      {/* Newsletter column */}
      {showNewsletter && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">{newsletterTitle}</h3>
          <p className="text-gray-600 text-sm mb-4">{newsletterDescription}</p>
          <form onSubmit={handleNewsletterSubmit} className="space-y-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              disabled={isSubmitting}
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? 'Subscribing...' : 'Subscribe'}
            </button>

            {submitStatus === 'success' && (
              <div className="flex items-center space-x-2 text-green-600 text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>Subscribed successfully!</span>
              </div>
            )}

            {submitStatus === 'error' && (
              <div className="flex items-center space-x-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>Failed to subscribe. Try again.</span>
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  )

  const renderSimpleVariant = () => (
    <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-6 md:space-y-0">
      {/* Logo */}
      {logo && (
        <Link href="/" className="inline-block">
          <Image
            src={logo.src}
            alt={logo.alt}
            width={logo.width || 120}
            height={logo.height || 32}
            className="h-8 w-auto"
          />
        </Link>
      )}

      {/* Links */}
      <nav className="flex flex-wrap gap-6">
        {menuData.map((item) => {
          if (item.type === 'divider') return null
          const href = getItemHref(item)
          const target = item.target || '_self'
          return (
            <Link
              key={item.id}
              href={href}
              target={target}
              className={`text-gray-600 hover:text-gray-900 transition-colors text-sm ${item.cssClass || ''}`}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Social links */}
      {socialLinks.length > 0 && (
        <div className="flex space-x-4">
          {socialLinks.map((link) => (
            <a
              key={link.platform}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label={`Follow us on ${link.platform}`}
            >
              {getSocialIcon(link.platform)}
            </a>
          ))}
        </div>
      )}
    </div>
  )

  const renderCenteredVariant = () => (
    <div className="text-center space-y-6">
      {/* Logo */}
      {logo && (
        <Link href="/" className="inline-block">
          <Image
            src={logo.src}
            alt={logo.alt}
            width={logo.width || 120}
            height={logo.height || 32}
            className="h-8 w-auto mx-auto"
          />
        </Link>
      )}

      {/* Links */}
      <nav className="flex flex-wrap justify-center gap-6">
        {menuData.map((item) => {
          if (item.type === 'divider') return null
          const href = getItemHref(item)
          const target = item.target || '_self'
          return (
            <Link
              key={item.id}
              href={href}
              target={target}
              className={`text-gray-600 hover:text-gray-900 transition-colors text-sm ${item.cssClass || ''}`}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Social links */}
      {socialLinks.length > 0 && (
        <div className="flex justify-center space-x-4">
          {socialLinks.map((link) => (
            <a
              key={link.platform}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label={`Follow us on ${link.platform}`}
            >
              {getSocialIcon(link.platform)}
            </a>
          ))}
        </div>
      )}

      {/* Newsletter */}
      {showNewsletter && (
        <div className="max-w-md mx-auto">
          <h3 className="font-semibold text-gray-900 mb-2">{newsletterTitle}</h3>
          <p className="text-gray-600 text-sm mb-4">{newsletterDescription}</p>
          <form onSubmit={handleNewsletterSubmit} className="flex space-x-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              disabled={isSubmitting}
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Subscribe
            </button>
          </form>

          {submitStatus === 'success' && (
            <div className="flex items-center justify-center space-x-2 text-green-600 text-sm mt-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Subscribed successfully!</span>
            </div>
          )}

          {submitStatus === 'error' && (
            <div className="flex items-center justify-center space-x-2 text-red-600 text-sm mt-2">
              <AlertCircle className="w-4 h-4" />
              <span>Failed to subscribe. Try again.</span>
            </div>
          )}
        </div>
      )}
    </div>
  )

  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="container mx-auto px-4 py-12">
        {variant === 'columns' && renderColumnsVariant()}
        {variant === 'simple' && renderSimpleVariant()}
        {variant === 'centered' && renderCenteredVariant()}
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-200 bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-2 md:space-y-0 text-sm text-gray-600">
            <p>
              {copyrightText || `© ${new Date().getFullYear()} All rights reserved.`}
            </p>

            {bottomLinks.length > 0 && (
              <div className="flex space-x-6">
                {bottomLinks.map((link, index) => (
                  <Link
                    key={index}
                    href={link.url}
                    className="hover:text-gray-900 transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  )
}
